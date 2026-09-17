import { h, screen, formatScore } from './dom.js';
import { fetchLeaderboard, fetchPlayer } from '../api/leaderboard.js';

const LIMIT = 10;

export class LeaderboardUI {
  constructor(root, { onBack }) {
    this.requestId = 0;
    this.nickname = null;

    this.statusEl = h('p', { class: 'lb-status' });
    this.body = h('tbody');
    this.youEl = h('p', { class: 'lb-you' });
    this.refreshBtn = h('button', { class: 'btn btn-small', type: 'button', text: 'LÀM MỚI', onclick: () => this.refresh() });

    this.el = screen(
      'modal-screen leaderboard-screen',
      h(
        'div',
        { class: 'panel lb-panel' },
        h('h2', { text: 'BẢNG XẾP HẠNG' }),
        h(
          'div',
          { class: 'lb-table-wrap' },
          h(
            'table',
            { class: 'lb-table' },
            h('thead', {}, h('tr', {}, h('th', { text: 'HẠNG' }), h('th', { text: 'NGƯỜI CHƠI' }), h('th', { text: 'ĐIỂM' }))),
            this.body,
          ),
        ),
        this.statusEl,
        this.youEl,
        h('div', { class: 'row' }, this.refreshBtn, h('button', { class: 'btn', type: 'button', text: 'QUAY LẠI', onclick: () => onBack() })),
      ),
    );
    root.append(this.el);
  }

  show(nickname) {
    this.nickname = nickname;
    this.el.hidden = false;
    this.load(false);
  }

  hide() {
    this.el.hidden = true;
    this.requestId++;
  }

  refresh() {
    this.refreshBtn.disabled = true;
    setTimeout(() => (this.refreshBtn.disabled = false), 5000);
    this.load(true);
  }

  async load(force) {
    const id = ++this.requestId;
    this.statusEl.textContent = 'ĐANG TẢI...';
    this.youEl.textContent = '';
    try {
      const entries = await fetchLeaderboard(LIMIT, { force });
      if (id !== this.requestId) return;
      this.render(entries);
      this.statusEl.textContent = entries.length === 0 ? 'CHƯA CÓ ĐIỂM NÀO. HÃY LÀ NGƯỜI ĐẦU TIÊN!' : '';
    } catch {
      if (id !== this.requestId) return;
      this.body.replaceChildren();
      this.statusEl.textContent = 'KHÔNG TẢI ĐƯỢC BẢNG XẾP HẠNG. HÃY THỬ LẠI SAU.';
      return;
    }

    if (!this.nickname) return;
    try {
      const me = await fetchPlayer(this.nickname);
      if (id !== this.requestId) return;
      this.youEl.textContent = me ? `KỶ LỤC CỦA BẠN: HẠNG ${me.rank} — ${formatScore(me.score)}` : `${this.nickname}: CHƯA CÓ ĐIỂM`;
    } catch {
      /* optional info */
    }
  }

  render(entries) {
    this.body.replaceChildren(
      ...entries.map((e) =>
        h(
          'tr',
          { class: e.nickname === this.nickname ? 'me' : '' },
          h('td', { text: `#${e.rank}` }),
          h('td', { text: e.nickname }),
          h('td', { text: formatScore(e.score) }),
        ),
      ),
    );
  }
}
