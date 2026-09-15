import { h, screen, formatScore } from './dom.js';

const OUTCOMES = {
  victory: 'PRESIDENT DUCK HAS BEEN DEFEATED!',
  escaped: 'THE PRESIDENT GOT AWAY...',
  arrested: "YOU'VE BEEN ARRESTED!",
};

export class ResultScreen {
  constructor(root, { onPlayAgain, onLeaderboard, onMenu }) {
    this.runId = null;
    this.outcomeEl = h('p', { class: 'result-outcome' });
    this.statsEl = h('dl', { class: 'result-stats' });
    this.submitEl = h('p', { class: 'result-submit' });
    this.rankEl = h('p', { class: 'result-rank' });

    this.el = screen(
      'modal-screen result-screen',
      h(
        'div',
        { class: 'panel result-panel' },
        h('h2', { text: 'FREEDOM REPORT' }),
        this.outcomeEl,
        this.statsEl,
        this.submitEl,
        this.rankEl,
        h(
          'div',
          { class: 'row' },
          h('button', { class: 'btn btn-primary', type: 'button', text: 'PLAY AGAIN', onclick: () => onPlayAgain() }),
          h('button', { class: 'btn', type: 'button', text: 'LEADERBOARD', onclick: () => onLeaderboard() }),
          h('button', { class: 'btn', type: 'button', text: 'MAIN MENU', onclick: () => onMenu() }),
        ),
      ),
    );
    root.append(this.el);
  }

  show(result) {
    const { stats } = result;
    this.runId = result.runId;
    this.outcomeEl.textContent = OUTCOMES[result.outcome] || '';
    this.outcomeEl.className = `result-outcome ${result.outcome === 'victory' ? 'good' : 'bad'}`;

    const rows = [
      ['SCORE', formatScore(result.score)],
      ['DUCKS SHOT', stats.ducksShot + stats.bodyguardsShot + (stats.presidentDefeated ? 1 : 0)],
      ['BODYGUARDS', stats.bodyguardsShot],
      ['QUESTIONS', stats.questions],
      ['CORRECT', stats.correct],
      ['WRONG', stats.wrong],
      ['BULLETS FIRED', stats.bulletsFired],
      ['BEST COMBO', `x${stats.bestStreak}`],
    ];
    this.statsEl.replaceChildren(
      ...rows.flatMap(([label, value]) => [h('dt', { text: label }), h('dd', { text: String(value) })]),
    );
    this.submitEl.textContent = 'SUBMITTING SCORE...';
    this.submitEl.className = 'result-submit';
    this.rankEl.textContent = '';
    this.el.hidden = false;
  }

  reveal() {
    this.el.hidden = false;
  }

  hide() {
    this.el.hidden = true;
  }

  setSubmitted(runId, response) {
    if (runId !== this.runId) return;
    this.submitEl.textContent = 'YOUR SCORE HAS BEEN SUBMITTED.';
    this.submitEl.className = 'result-submit good';
    if (response.rank) {
      this.rankEl.textContent = response.isNewBest
        ? `YOUR RANK: #${response.rank}`
        : `YOUR RANK: #${response.rank} (BEST ${formatScore(response.best)})`;
    }
  }

  setError(runId, message) {
    if (runId !== this.runId) return;
    this.submitEl.textContent = message;
    this.submitEl.className = 'result-submit bad';
  }
}
