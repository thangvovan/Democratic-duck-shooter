// Main menu, how-to-play, nickname entry and pause overlay (DOM).
import { h, screen } from './dom.js';
import { RULES, sanitizeNickname, isValidNickname } from '../data/rules.js';

export class Menu {
  constructor(root, handlers) {
    this.handlers = handlers;

    this.muteButtons = [];
    const muteButton = () => {
      const btn = h('button', { class: 'btn btn-small', type: 'button', onclick: () => handlers.onToggleMute() });
      this.muteButtons.push(btn);
      return btn;
    };

    this.main = screen(
      'menu-screen',
      h(
        'div',
        { class: 'menu-title' },
        h('h1', {}, h('span', { class: 'title-line' , text: "LET'S SHOOT" }), h('span', { class: 'title-line title-accent', text: 'THE DUCK' })),
        h('p', { class: 'subtitle', text: 'FREEDOM. RIGHTS. AMMO. DUCKS.' }),
      ),
      h(
        'div',
        { class: 'menu-buttons' },
        h('button', { class: 'btn btn-primary', type: 'button', text: 'PLAY', onclick: () => handlers.onPlay() }),
        h('button', { class: 'btn', type: 'button', text: 'LEADERBOARD', onclick: () => handlers.onLeaderboard() }),
        h('button', { class: 'btn', type: 'button', text: 'HOW TO PLAY', onclick: () => this.showHowTo() }),
        muteButton(),
      ),
      h('p', { class: 'footnote', text: 'A PARODY GAME. NO REAL DUCKS WERE HARMED.' }),
    );

    this.howTo = screen(
      'modal-screen',
      h(
        'div',
        { class: 'panel' },
        h('h2', { text: 'HOW TO PLAY' }),
        h(
          'ol',
          { class: 'howto-list' },
          h('li', { text: 'ANSWER QUESTIONS. CORRECT = +1 BULLET.' }),
          h('li', { text: 'CLICK TO SHOOT DUCKS. HIT = POINTS.' }),
          h('li', { text: '3 HITS IN A ROW = COMBO x1.5, 5 HITS = x2.' }),
          h('li', { text: 'STAGE 2: EVERY WRONG ANSWER ARMS THE COPS. SHOOT THEIR BULLETS TO BLOCK.' }),
          h('li', { text: 'STAGE 3: DOWN 3 BODYGUARDS, THEN HIT PRESIDENT DUCK. 3 MISSES AND HE ESCAPES.' }),
        ),
        h('p', { class: 'hint', text: 'ESC = PAUSE   M = MUTE   1-4 / A-D = ANSWER' }),
        h('button', { class: 'btn', type: 'button', text: 'BACK', onclick: () => this.showMain() }),
      ),
    );

    this.nameInput = h('input', {
      class: 'name-input',
      type: 'text',
      maxlength: String(RULES.NICKNAME_MAX),
      autocomplete: 'off',
      spellcheck: 'false',
      'aria-label': 'Nickname',
      placeholder: 'DUCKMASTER',
    });
    this.nameInput.addEventListener('input', () => {
      const cleaned = this.nameInput.value.toUpperCase().replace(/[^A-Z0-9 _-]/g, '');
      if (cleaned !== this.nameInput.value) this.nameInput.value = cleaned;
      this.nameError.textContent = '';
    });
    this.nameError = h('p', { class: 'error', role: 'alert' });
    const form = h(
      'form',
      { class: 'panel name-panel', novalidate: true },
      h('h2', { text: 'ENTER YOUR NAME' }),
      this.nameInput,
      this.nameError,
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'btn', type: 'button', text: 'BACK', onclick: () => handlers.onBackToMenu() }),
        h('button', { class: 'btn btn-primary', type: 'submit', text: 'START' }),
      ),
    );
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = sanitizeNickname(this.nameInput.value);
      if (!isValidNickname(name)) {
        this.nameError.textContent = `${RULES.NICKNAME_MIN}-${RULES.NICKNAME_MAX} CHARACTERS: A-Z, 0-9, _ -`;
        return;
      }
      handlers.onNameConfirmed(name);
    });
    this.name = screen('modal-screen', form);

    this.pause = screen(
      'modal-screen pause-screen',
      h(
        'div',
        { class: 'panel' },
        h('h2', { text: 'PAUSED' }),
        h(
          'div',
          { class: 'menu-buttons' },
          h('button', { class: 'btn btn-primary', type: 'button', text: 'RESUME', onclick: () => handlers.onResume() }),
          muteButton(),
          h('button', { class: 'btn', type: 'button', text: 'QUIT TO MENU', onclick: () => handlers.onQuit() }),
        ),
      ),
    );

    root.append(this.main, this.howTo, this.name, this.pause);
  }

  setMuted(muted) {
    for (const btn of this.muteButtons) btn.textContent = muted ? 'UNMUTE' : 'MUTE';
  }

  hideAll() {
    this.main.hidden = true;
    this.howTo.hidden = true;
    this.name.hidden = true;
  }

  showMain() {
    this.hideAll();
    this.main.hidden = false;
  }

  showHowTo() {
    this.hideAll();
    this.howTo.hidden = false;
  }

  showName(prefill = '') {
    this.hideAll();
    this.name.hidden = false;
    this.nameInput.value = prefill;
    this.nameError.textContent = '';
    this.nameInput.focus();
    this.nameInput.select();
  }

  showPause(visible) {
    this.pause.hidden = !visible;
  }
}
