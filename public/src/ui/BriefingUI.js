// Generic info panel: how-to-play before the tutorial, stage rules before each stage, etc.
import { h, screen } from './dom.js';

export class BriefingUI {
  constructor(root) {
    this.onContinue = null;
    this.titleEl = h('h2');
    this.subtitleEl = h('p', { class: 'briefing-subtitle' });
    this.listEl = h('ul', { class: 'briefing-list' });
    this.button = h('button', { class: 'btn btn-primary', type: 'button', onclick: () => this.continue() });
    this.el = screen(
      'modal-screen briefing-screen',
      h('div', { class: 'panel briefing-panel' }, this.titleEl, this.subtitleEl, this.listEl, this.button),
    );
    root.append(this.el);
  }

  get visible() {
    return !this.el.hidden;
  }

  show({ title, subtitle = '', lines = [], button = 'CONTINUE', onContinue }) {
    this.titleEl.textContent = title;
    this.subtitleEl.textContent = subtitle;
    this.subtitleEl.hidden = !subtitle;
    this.listEl.replaceChildren(...lines.map((line) => h('li', { text: line })));
    this.button.textContent = button;
    this.onContinue = onContinue;
    this.el.hidden = false;
    this.button.focus({ preventScroll: true });
  }

  continue() {
    const next = this.onContinue;
    this.hide();
    next?.();
  }

  hide() {
    this.onContinue = null;
    this.el.hidden = true;
  }
}
