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
    this.refreshBtn = h('button', { class: 'btn btn-small', type: 'button', text: 'REFRESH', onclick: () => this.refresh() });

    this.el = screen(
      'modal-screen leaderboard-screen',
      h(
        'div',
        { class: 'panel lb-panel' },
        h('h2', { text: 'LEADERBOARD' }),
        h(
          'div',
          { class: 'lb-table-wrap' },
          h(
            'table',
            { class: 'lb-table' },
            h('thead', {}, h('tr', {}, h('th', { text: 'RANK' }), h('th', { text: 'PLAYER' }), h('th', { text: 'SCORE' }))),
            this.body,
          ),
        ),
        this.statusEl,
        this.youEl,
        h('div', { class: 'row' }, this.refreshBtn, h('button', { class: 'btn', type: 'button', text: 'BACK', onclick: () => onBack() })),
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
    this.statusEl.textContent = 'LOADING...';
    this.youEl.textContent = '';
    try {
      const entries = await fetchLeaderboard(LIMIT, { force });
      if (id !== this.requestId) return;
      this.render(entries);
      this.statusEl.textContent = entries.length === 0 ? 'NO SCORES YET. BE THE FIRST!' : '';
    } catch {
      if (id !== this.requestId) return;
      this.body.replaceChildren();
      this.statusEl.textContent = 'LEADERBOARD UNAVAILABLE. TRY AGAIN LATER.';
      return;
    }

    if (!this.nickname) return;
    try {
      const me = await fetchPlayer(this.nickname);
      if (id !== this.requestId) return;
      this.youEl.textContent = me ? `YOUR BEST: #${me.rank} — ${formatScore(me.score)}` : `${this.nickname}: NO SCORE YET`;
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
