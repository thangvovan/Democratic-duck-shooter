import { h, screen, formatScore } from './dom.js';

const OUTCOMES = {
  victory: 'ĐÂY LÀ TỰ DO!',
  escaped: 'HẾT GIỜ! TRÙM VẪN AN TOÀN...',
  arrested: 'BẠN ĐÃ BỊ BẮT!',
  shot: 'BẠN ĐÃ BỊ HẠ!',
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
        h('h2', { text: 'BÁO CÁO TỰ DO' }),
        this.outcomeEl,
        this.statsEl,
        this.submitEl,
        this.rankEl,
        h(
          'div',
          { class: 'row' },
          h('button', { class: 'btn btn-primary', type: 'button', text: 'CHƠI LẠI', onclick: () => onPlayAgain() }),
          h('button', { class: 'btn', type: 'button', text: 'BẢNG XẾP HẠNG', onclick: () => onLeaderboard() }),
          h('button', { class: 'btn', type: 'button', text: 'MENU CHÍNH', onclick: () => onMenu() }),
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
      ['ĐIỂM', formatScore(result.score)],
      ['VỊT ĐÃ BẮN', stats.ducksShot + stats.bodyguardsShot + (stats.presidentDefeated ? 1 : 0)],
      ['VỆ SĨ', stats.bodyguardsShot],
      ['CÂU HỎI', stats.questions],
      ['ĐÚNG', stats.correct],
      ['SAI', stats.wrong],
      ['ĐẠN ĐÃ BẮN', stats.bulletsFired],
      ['COMBO CAO NHẤT', `x${stats.bestStreak}`],
    ];
    this.statsEl.replaceChildren(
      ...rows.flatMap(([label, value]) => [h('dt', { text: label }), h('dd', { text: String(value) })]),
    );
    this.submitEl.textContent = 'ĐANG GỬI ĐIỂM...';
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
    this.submitEl.textContent = 'ĐÃ GỬI ĐIỂM CỦA BẠN.';
    this.submitEl.className = 'result-submit good';
    if (response.rank) {
      this.rankEl.textContent = response.isNewBest
        ? `HẠNG CỦA BẠN: #${response.rank}`
        : `HẠNG CỦA BẠN: #${response.rank} (KỶ LỤC ${formatScore(response.best)})`;
    }
  }

  setError(runId, message) {
    if (runId !== this.runId) return;
    this.submitEl.textContent = message;
    this.submitEl.className = 'result-submit bad';
  }
}
