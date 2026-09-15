// Zero-dependency Node server for local development and self-hosted production.
// Serves ./public and routes /api/* to the same handlers Vercel deploys as serverless functions.

import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sessionHandler from './api/session.js';
import scoresHandler from './api/scores.js';
import leaderboardHandler from './api/leaderboard/index.js';
import playerHandler from './api/leaderboard/[nickname].js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_BYTES = 8192;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.woff2': 'font/woff2',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function route(pathname) {
  if (pathname === '/api/session') return { handler: sessionHandler };
  if (pathname === '/api/scores') return { handler: scoresHandler };
  if (pathname === '/api/leaderboard' || pathname === '/api/leaderboard/') return { handler: leaderboardHandler };
  const match = pathname.match(/^\/api\/leaderboard\/([^/]+)$/);
  if (match) {
    try {
      return { handler: playerHandler, params: { nickname: decodeURIComponent(match[1]) } };
    } catch {
      return null;
    }
  }
  return null;
}

async function handleApi(req, res, url) {
  const found = route(url.pathname);
  if (!found) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }
  req.query = { ...Object.fromEntries(url.searchParams), ...found.params };
  if (req.method === 'POST') {
    const raw = await readBody(req);
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = raw;
    }
  }
  await found.handler(req, res);
}

async function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end();
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  const filePath = path.resolve(PUBLIC_DIR, '.' + pathname);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end();
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' || ext === '.js' || ext === '.css' ? 'no-cache' : 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else await serveStatic(req, res, url);
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    if (!res.headersSent) {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: status === 413 ? 'Body too large' : 'Internal server error' }));
    }
  }
});

server.keepAliveTimeout = 5000;
server.headersTimeout = 10000;
server.requestTimeout = 15000;

server.listen(PORT, () => {
  console.log(`LET'S SHOOT THE DUCK running at http://localhost:${PORT}`);
});
