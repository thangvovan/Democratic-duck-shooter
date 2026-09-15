// Question panel (DOM). Timing is driven by the game loop via update(dt), so pausing
// freezes the timer and nothing needs to be cleaned up with setTimeout.
// After an answer the question slides out right away and the next one slides in.
import { h, screen } from './dom.js';
import { RULES } from '../data/rules.js';
import { formatTime } from '../utils/math.js';

const KEYS = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
const LETTERS = ['A', 'B', 'C', 'D'];

// Restart a CSS animation class on an element.
function replay(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

export class QuestionUI {
  constructor(root, audio) {
    this.audio = audio;
    this.opts = null;
    this.phase = 'idle';

    this.stageEl = h('span', { class: 'q-stage' });
    this.progressEl = h('span', { class: 'q-progress' });
    this.stageTimeEl = h('span', { class: 'q-stage-time' });
    this.shownStageSecond = -1;
    this.rewardsEl = h('div', { class: 'q-rewards' });
    this.timerFill = h('div', { class: 'q-timer-fill' });
    this.textEl = h('h2', { class: 'q-text' });
    this.feedbackEl = h('p', { class: 'q-feedback', 'aria-live': 'polite' });
    this.buttons = LETTERS.map((letter, i) => {
      const label = h('span', { class: 'opt-text' });
      const btn = h(
        'button',
        { class: 'btn q-option', type: 'button', onclick: () => this.choose(i) },
        h('span', { class: 'opt-key', text: letter }),
        label,
      );
      btn.label = label;
      return btn;
    });
    this.bodyEl = h('div', { class: 'q-body' }, this.textEl, h('div', { class: 'q-options' }, this.buttons));

    this.el = screen(
      'question-screen',
      h(
        'div',
        { class: 'panel q-panel' },
        h('header', { class: 'q-header' }, this.stageEl, this.progressEl, this.stageTimeEl),
        this.rewardsEl,
        h('div', { class: 'q-timer' }, this.timerFill),
        this.bodyEl,
        this.feedbackEl,
      ),
    );
    root.append(this.el);
  }

  get active() {
    return this.opts !== null;
  }

  start(opts) {
    this.opts = opts;
    this.index = 0;
    this.stageEl.textContent = opts.title;
    this.feedbackEl.textContent = '';
    this.feedbackEl.className = 'q-feedback';
    this.shownStageSecond = -1;
    this.renderStageTime();
    this.el.hidden = false;
    this.showQuestion();
  }

  showQuestion() {
    const { questions, subtitle } = this.opts;
    const q = questions[this.index];
    this.progressEl.textContent = `${subtitle} · Q${this.index + 1}/${questions.length}`;
    this.textEl.textContent = q.question;
    this.buttons.forEach((btn, i) => {
      btn.label.textContent = q.options[i];
      btn.disabled = false;
      btn.classList.remove('correct', 'wrong');
    });
    this.bodyEl.classList.remove('q-leave');
    replay(this.bodyEl, 'q-enter');
    this.timeLeft = RULES.QUESTION_TIME;
    this.lastTick = Math.ceil(this.timeLeft);
    this.phase = 'answer';
    this.renderRewards();
    this.renderTimer();
  }

  renderRewards() {
    const r = this.opts.getRewards();
    const items = [h('span', { class: 'reward reward-ammo', text: `YOUR BULLETS: ${r.ammo}` })];
    if (r.enemyAmmo != null) {
      items.push(h('span', { class: 'reward reward-enemy', text: `${r.enemyLabel || 'ENEMY BULLETS'}: ${r.enemyAmmo}` }));
    }
    this.rewardsEl.replaceChildren(...items);
  }

  renderTimer() {
    const ratio = Math.max(0, this.timeLeft / RULES.QUESTION_TIME);
    this.timerFill.style.transform = `scaleX(${ratio})`;
    this.timerFill.classList.toggle('low', this.timeLeft <= 3);
  }

  choose(index) {
    if (!this.opts || this.phase !== 'answer') return;
    this.audio.unlock();
    const q = this.opts.questions[this.index];
    const correct = this.opts.onAnswer(q, index);

    this.buttons.forEach((btn) => (btn.disabled = true));
    this.buttons[this.opts.getCorrectIndex(q)].classList.add('correct');
    if (!correct && index >= 0) this.buttons[index].classList.add('wrong');

    this.feedbackEl.className = `q-feedback ${correct ? 'good' : 'bad'}`;
    if (correct) {
      this.feedbackEl.textContent = 'CORRECT! +1 BULLET';
      this.audio.play('correct');
    } else {
      const head = index < 0 ? "TIME'S UP!" : 'WRONG!';
      this.feedbackEl.textContent = this.opts.wrongText ? `${head} ${this.opts.wrongText}` : head;
      this.audio.play('wrong');
    }
    replay(this.feedbackEl, 'q-pop');
    this.renderRewards();

    // Slide to the next question immediately.
    this.bodyEl.classList.remove('q-enter');
    this.bodyEl.classList.add('q-leave');
    this.phase = 'feedback';
    this.feedbackTimer = RULES.QUESTION_FEEDBACK_TIME;
  }

  renderStageTime() {
    const seconds = Math.ceil(this.opts.getStageTime?.() ?? 0);
    if (seconds === this.shownStageSecond) return;
    this.shownStageSecond = seconds;
    this.stageTimeEl.textContent = `STAGE ${formatTime(seconds)}`;
    this.stageTimeEl.classList.toggle('bad', seconds <= 20);
  }

  update(dt) {
    if (!this.opts) return;
    this.renderStageTime();
    if (this.phase === 'answer') {
      this.timeLeft -= dt;
      const second = Math.ceil(this.timeLeft);
      if (second < this.lastTick) {
        this.lastTick = second;
        if (second <= 3 && second > 0) this.audio.play('tick');
      }
      this.renderTimer();
      if (this.timeLeft <= 0) this.choose(-1);
    } else if (this.phase === 'feedback') {
      this.feedbackTimer -= dt;
      if (this.feedbackTimer <= 0) {
        this.index++;
        if (this.index < this.opts.questions.length) this.showQuestion();
        else this.finish();
      }
    }
  }

  handleKey(key) {
    const index = KEYS[key.toLowerCase()];
    if (index !== undefined) this.choose(index);
  }

  finish() {
    const done = this.opts.onComplete;
    this.cancel();
    done();
  }

  cancel() {
    this.opts = null;
    this.phase = 'idle';
    this.el.hidden = true;
    this.bodyEl.classList.remove('q-leave', 'q-enter');
  }
}
