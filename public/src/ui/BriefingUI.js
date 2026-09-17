// Click-through slides: a drawn illustration on top, a short line of text below.
// Used for how-to-play and the stage briefings.
import { h, screen } from './dom.js';
import { SLIDE_ART } from './slideArt.js';

const ART_W = 440;
const ART_H = 150;

export class BriefingUI {
  constructor(root) {
    this.onContinue = null;
    this.slides = [];
    this.index = 0;
    this.finalLabel = 'TIẾP TỤC';

    this.titleEl = h('h2');
    this.subtitleEl = h('p', { class: 'briefing-subtitle' });
    this.canvas = h('canvas', { class: 'slide-art', width: String(ART_W), height: String(ART_H) });
    this.headingEl = h('p', { class: 'slide-heading' });
    this.textEl = h('p', { class: 'slide-text' });
    this.dotsEl = h('div', { class: 'slide-dots' });
    this.backBtn = h('button', { class: 'btn btn-small', type: 'button', text: 'QUAY LẠI', onclick: () => this.back() });
    this.nextBtn = h('button', { class: 'btn btn-primary', type: 'button', text: 'TIẾP', onclick: () => this.next() });

    this.el = screen(
      'modal-screen briefing-screen',
      h(
        'div',
        { class: 'panel briefing-panel' },
        this.titleEl,
        this.subtitleEl,
        this.canvas,
        h('div', { class: 'slide-body' }, this.headingEl, this.textEl),
        this.dotsEl,
        h('div', { class: 'row' }, this.backBtn, this.nextBtn),
      ),
    );
    root.append(this.el);
  }

  get visible() {
    return !this.el.hidden;
  }

  show({ title, subtitle = '', slides = [], button = 'TIẾP TỤC', onContinue }) {
    this.titleEl.textContent = title;
    this.subtitleEl.textContent = subtitle;
    this.subtitleEl.hidden = !subtitle;
    this.slides = slides;
    this.finalLabel = button;
    this.onContinue = onContinue;
    this.el.hidden = false;
    this.goto(0);
  }

  goto(index) {
    this.index = Math.min(Math.max(index, 0), this.slides.length - 1);
    const slide = this.slides[this.index];
    const last = this.index === this.slides.length - 1;

    this.headingEl.textContent = slide?.title ?? '';
    this.textEl.textContent = slide?.text ?? '';
    this.backBtn.disabled = this.index === 0;
    this.nextBtn.textContent = last ? this.finalLabel : 'TIẾP';
    this.dotsEl.replaceChildren(
      ...this.slides.map((_, i) => h('span', { class: `dot ${i === this.index ? 'on' : ''}` })),
    );
    this.draw(slide?.art);
    this.nextBtn.focus({ preventScroll: true });
  }

  draw(artKey) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.canvas.width !== ART_W * dpr) {
      this.canvas.width = ART_W * dpr;
      this.canvas.height = ART_H * dpr;
    }
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ART_W, ART_H);
    SLIDE_ART[artKey]?.(ctx);
  }

  next() {
    if (this.index < this.slides.length - 1) this.goto(this.index + 1);
    else this.continue();
  }

  back() {
    if (this.index > 0) this.goto(this.index - 1);
  }

  continue() {
    const done = this.onContinue;
    this.hide();
    done?.();
  }

  hide() {
    this.onContinue = null;
    this.el.hidden = true;
  }
}
