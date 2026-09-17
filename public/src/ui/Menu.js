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
        h('h1', {}, h('span', { class: 'title-line' , text: 'DEMOCRATIC' }), h('span', { class: 'title-line title-accent', text: 'DUCK SHOOTER' })),
        h('p', { class: 'subtitle', text: 'QUYỀN. TỰ DO. ĐẠN. VỊT.' }),
      ),
      h(
        'div',
        { class: 'menu-buttons' },
        h('button', { class: 'btn btn-primary', type: 'button', text: 'CHƠI', onclick: () => handlers.onPlay() }),
        h('button', { class: 'btn', type: 'button', text: 'BẢNG XẾP HẠNG', onclick: () => handlers.onLeaderboard() }),
        h('button', { class: 'btn', type: 'button', text: 'CÁCH CHƠI', onclick: () => handlers.onHowTo() }),
        muteButton(),
      ),
      h('p', { class: 'footnote', text: 'GAME TROLL. KHÔNG CON VỊT THẬT NÀO BỊ HẠI.' }),
    );

    this.nameInput = h('input', {
      class: 'name-input',
      type: 'text',
      maxlength: String(RULES.NICKNAME_MAX),
      autocomplete: 'off',
      spellcheck: 'false',
      'aria-label': 'Tên người chơi',
      placeholder: 'DUCKMASTER',
    });
    this.nameInput.addEventListener('input', () => {
      // Vietnamese names are allowed as input: accents are dropped ("Thắng" -> "THANG").
      const cleaned = this.nameInput.value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[đĐ]/g, 'D')
        .toUpperCase()
        .replace(/[^A-Z0-9 _-]/g, '');
      if (cleaned !== this.nameInput.value) this.nameInput.value = cleaned;
      this.nameError.textContent = '';
    });
    this.nameError = h('p', { class: 'error', role: 'alert' });
    const form = h(
      'form',
      { class: 'panel name-panel', novalidate: true },
      h('h2', { text: 'NHẬP TÊN CỦA BẠN' }),
      this.nameInput,
      this.nameError,
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'btn', type: 'button', text: 'QUAY LẠI', onclick: () => handlers.onBackToMenu() }),
        h('button', { class: 'btn btn-primary', type: 'submit', text: 'BẮT ĐẦU' }),
      ),
    );
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = sanitizeNickname(this.nameInput.value);
      if (!isValidNickname(name)) {
        this.nameError.textContent = `TỪ ${RULES.NICKNAME_MIN} ĐẾN ${RULES.NICKNAME_MAX} KÝ TỰ: CHỮ KHÔNG DẤU, SỐ, _ -`;
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
        h('h2', { text: 'TẠM DỪNG' }),
        h(
          'div',
          { class: 'menu-buttons' },
          h('button', { class: 'btn btn-primary', type: 'button', text: 'CHƠI TIẾP', onclick: () => handlers.onResume() }),
          muteButton(),
          h('button', { class: 'btn', type: 'button', text: 'VỀ MENU', onclick: () => handlers.onQuit() }),
        ),
      ),
    );

    root.append(this.main, this.name, this.pause);
  }

  setMuted(muted) {
    for (const btn of this.muteButtons) btn.textContent = muted ? 'BẬT TIẾNG' : 'TẮT TIẾNG';
  }

  hideAll() {
    this.main.hidden = true;
    this.name.hidden = true;
  }

  showMain() {
    this.hideAll();
    this.main.hidden = false;
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
