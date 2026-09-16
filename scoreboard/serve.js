// Local realtime leaderboard display.
// Reads the same data as the game: Redis when REDIS_URL is set, otherwise ./data/scores.json.
// Pushes updates to the browser over Server-Sent Events; only changes are sent.
//
//   npm run scoreboard          -> http://localhost:4000

import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const SCORES_FILE = path.join(process.cwd(), 'data', 'scores.json');

const PORT = Number(process.env.SCOREBOARD_PORT) || 4000;
const LIMIT = Number(process.env.SCOREBOARD_LIMIT) || 15;
const POLL_MS = Number(process.env.SCOREBOARD_POLL_MS) || 2000;
const USE_REDIS = Boolean(process.env.REDIS_URL);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

const getStore = USE_REDIS ? (await import('../lib/store.js')).getStore : null;

async function readEntries() {
  if (USE_REDIS) return getStore().top(LIMIT);
  // Local file mode: re-read every poll so writes from a running game server show up.
  try {
    const data = JSON.parse(await fs.readFile(SCORES_FILE, 'utf8'));
    return (data.best || [])
      .sort((a, b) => b.score - a.score || String(a.createdAt).localeCompare(String(b.createdAt)))
      .slice(0, LIMIT)
      .map((record, i) => ({ rank: i + 1, nickname: record.nickname, score: record.score }));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[scoreboard]', err.message);
    return [];
  }
}

const clients = new Set();
let lastEntries = '[]';

function send(res, payload) {
  res.write(`data: ${payload}\n\n`);
}

async function poll() {
  try {
    const entries = JSON.stringify(await readEntries());
    if (entries === lastEntries) return;
    lastEntries = entries;
    for (const res of clients) send(res, entries);
  } catch (err) {
    console.error('[scoreboard] poll failed:', err.message);
  }
}

async function serveStatic(res, pathname) {
  const file = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(PUBLIC_DIR, file);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 2000\n\n');
    send(res, lastEntries);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  await serveStatic(res, url.pathname);
});

// Keep idle SSE connections alive.
setInterval(() => {
  for (const res of clients) res.write(': ping\n\n');
}, 20_000).unref?.();

await poll();
setInterval(poll, POLL_MS);

server.listen(PORT, () => {
  console.log(`Scoreboard on http://localhost:${PORT} (source: ${USE_REDIS ? 'redis' : SCORES_FILE})`);
});
