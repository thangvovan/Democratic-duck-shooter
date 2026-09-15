import { h, screen } from './dom.js';

export class TutorialUI {
  constructor(root) {
    this.onStart = null;
    this.el = screen(
      'modal-screen tutorial-screen',
      h(
        'div',
        { class: 'panel' },
        h('h2', { class: 'good', text: 'GOOD SHOT!' }),
        h(
          'ol',
          { class: 'howto-list' },
          h('li', { text: 'ANSWER QUESTIONS → GET BULLETS' }),
          h('li', { text: 'SHOOT DUCKS → GET SCORE' }),
          h('li', { text: 'HIT IN A ROW → COMBO BONUS' }),
        ),
        h('button', {
          class: 'btn btn-primary',
          type: 'button',
          text: 'START GAME',
          onclick: () => {
            const start = this.onStart;
            this.hide();
            start?.();
          },
        }),
      ),
    );
    root.append(this.el);
  }

  show(onStart) {
    this.onStart = onStart;
    this.el.hidden = false;
  }

  hide() {
    this.onStart = null;
    this.el.hidden = true;
  }
}
