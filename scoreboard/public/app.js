// Realtime leaderboard client. Rows keep their identity across updates, so a rank change
// is animated with a FLIP transition (measure old position, reorder, slide from the old spot).

const rowsEl = document.getElementById('rows');
const statusEl = document.getElementById('status');
const emptyEl = document.getElementById('empty');

const rows = new Map(); // nickname -> { el, rank, score }
const format = (n) => n.toLocaleString('en-US');

function buildRow(entry) {
  const el = document.createElement('div');
  el.className = 'row fresh';
  // Drop the entry animation class once it is done (timeout, so it also clears when
  // animations are disabled by prefers-reduced-motion).
  setTimeout(() => el.classList.remove('fresh'), 700);
  el.innerHTML = '<span class="rank"></span><span class="name"></span><span class="score"></span>';
  el.querySelector('.name').textContent = entry.nickname;
  return el;
}

function countUp(el, from, to) {
  if (from === to) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const duration = 600;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = format(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function render(entries) {
  emptyEl.hidden = entries.length > 0;

  // FIRST: where every existing row is right now.
  const firstRects = new Map();
  for (const [nickname, row] of rows) firstRects.set(nickname, row.el.getBoundingClientRect().top);

  const seen = new Set();
  for (const entry of entries) {
    seen.add(entry.nickname);
    let row = rows.get(entry.nickname);
    if (!row) {
      row = { el: buildRow(entry), rank: entry.rank, score: entry.score };
      rows.set(entry.nickname, row);
      row.el.querySelector('.score').textContent = format(entry.score);
    }
    const el = row.el;
    el.classList.remove('up', 'down', 'scored');
    el.classList.toggle('top1', entry.rank === 1);
    el.classList.toggle('top2', entry.rank === 2);
    el.classList.toggle('top3', entry.rank === 3);

    const rankEl = el.querySelector('.rank');
    const moved = row.rank !== entry.rank;
    const delta = row.rank - entry.rank; // positive = moved up
    rankEl.textContent = `#${entry.rank}`;
    if (moved && firstRects.has(entry.nickname)) {
      const mark = document.createElement('span');
      mark.className = `delta ${delta > 0 ? 'up' : 'down'}`;
      mark.textContent = delta > 0 ? `▲${delta}` : `▼${-delta}`;
      rankEl.append(mark);
      el.classList.add(delta > 0 ? 'up' : 'down');
      setTimeout(() => mark.remove(), 2500);
    }

    if (entry.score !== row.score) {
      countUp(el.querySelector('.score'), row.score, entry.score);
      el.classList.add('scored');
    }

    row.rank = entry.rank;
    row.score = entry.score;
    rowsEl.append(el); // re-appending in order is the reorder
  }

  // Drop rows that fell out of the top list.
  for (const [nickname, row] of rows) {
    if (seen.has(nickname)) continue;
    row.el.remove();
    rows.delete(nickname);
  }

  // LAST + INVERT + PLAY: slide each moved row from where it used to be.
  for (const [nickname, row] of rows) {
    const before = firstRects.get(nickname);
    if (before === undefined) continue;
    const after = row.el.getBoundingClientRect().top;
    const shift = before - after;
    if (Math.abs(shift) < 1) continue;
    row.el.classList.remove('moving');
    row.el.style.transform = `translateY(${shift}px)`;
    requestAnimationFrame(() => {
      row.el.classList.add('moving');
      row.el.style.transform = '';
    });
  }
}

function setStatus(state, text) {
  statusEl.className = `status ${state}`;
  statusEl.textContent = text;
}

let source;
function connect() {
  source = new EventSource('/events');
  source.onopen = () => setStatus('live', 'LIVE');
  source.onmessage = (event) => {
    setStatus('live', 'LIVE');
    try {
      render(JSON.parse(event.data));
    } catch (err) {
      console.error('bad payload', err);
    }
  };
  source.onerror = () => setStatus('offline', 'RECONNECTING…');
}

connect();
