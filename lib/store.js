// Persistence layer.
// - Production: Upstash Redis over its REST API (stateless, no open connections).
//   Env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//        (or KV_REST_API_URL + KV_REST_API_TOKEN from the Vercel marketplace integration).
// - Local: JSON file in ./data (in-memory only when running on Vercel without Redis).

import { promises as fs } from 'node:fs';
import path from 'node:path';

const PREFIX = 'lsd:';
const LEADERBOARD_KEY = PREFIX + 'leaderboard';
const BEST_META_KEY = PREFIX + 'best';
const LOG_KEY = PREFIX + 'scores';
const LOG_LIMIT = 5000;

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

function createRedisStore() {
  const base = REDIS_URL.replace(/\/+$/, '');

  async function pipeline(commands) {
    const response = await fetch(base + '/pipeline', {
      method: 'POST',
      headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Redis HTTP ${response.status}`);
    const results = await response.json();
    return results.map((item) => {
      if (item.error) throw new Error(`Redis error: ${item.error}`);
      return item.result;
    });
  }

  return {
    kind: 'redis',

    async hit(key, windowSeconds) {
      const k = PREFIX + 'rl:' + key;
      const [, count] = await pipeline([
        ['SET', k, '0', 'EX', String(windowSeconds), 'NX'],
        ['INCR', k],
      ]);
      return Number(count);
    },

    async claimOnce(key, ttlSeconds) {
      const [result] = await pipeline([['SET', PREFIX + 'once:' + key, '1', 'EX', String(ttlSeconds), 'NX']]);
      return result === 'OK';
    },

    async submitScore(record) {
      const [currentRaw] = await pipeline([['ZSCORE', LEADERBOARD_KEY, record.nickname]]);
      const current = currentRaw === null ? null : Number(currentRaw);
      const isNewBest = current === null || record.score > current;

      const commands = [
        ['LPUSH', LOG_KEY, JSON.stringify(record)],
        ['LTRIM', LOG_KEY, '0', String(LOG_LIMIT - 1)],
      ];
      if (isNewBest) {
        commands.push(['ZADD', LEADERBOARD_KEY, 'GT', String(record.score), record.nickname]);
        commands.push(['HSET', BEST_META_KEY, record.nickname, JSON.stringify(record)]);
      }
      commands.push(['ZREVRANK', LEADERBOARD_KEY, record.nickname]);
      commands.push(['ZSCORE', LEADERBOARD_KEY, record.nickname]);

      const results = await pipeline(commands);
      const rank = results[results.length - 2];
      const best = results[results.length - 1];
      return { rank: rank === null ? null : Number(rank) + 1, best: Number(best), isNewBest };
    },

    async top(limit) {
      const [flat] = await pipeline([['ZRANGE', LEADERBOARD_KEY, '0', String(limit - 1), 'REV', 'WITHSCORES']]);
      const entries = [];
      for (let i = 0; i < flat.length; i += 2) {
        entries.push({ rank: i / 2 + 1, nickname: flat[i], score: Number(flat[i + 1]) });
      }
      return entries;
    },

    async player(nickname) {
      const [score, rank] = await pipeline([
        ['ZSCORE', LEADERBOARD_KEY, nickname],
        ['ZREVRANK', LEADERBOARD_KEY, nickname],
      ]);
      if (score === null) return null;
      return { nickname, score: Number(score), rank: Number(rank) + 1 };
    },
  };
}

function createLocalStore({ persist }) {
  const filePath = path.join(process.cwd(), 'data', 'scores.json');
  const best = new Map(); // nickname -> record
  let log = [];
  let sorted = null; // cached leaderboard, invalidated on write
  const counters = new Map(); // key -> { count, expiresAt }
  const once = new Map(); // key -> expiresAt
  let loaded = false;
  let saveTimer = null;

  // Periodically drop expired rate-limit / token entries so memory stays bounded.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of counters) if (v.expiresAt <= now) counters.delete(k);
    for (const [k, exp] of once) if (exp <= now) once.delete(k);
  }, 30_000);
  cleanup.unref?.();

  async function load() {
    if (loaded) return;
    loaded = true;
    if (!persist) return;
    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      for (const record of data.best || []) best.set(record.nickname, record);
      log = Array.isArray(data.log) ? data.log.slice(0, LOG_LIMIT) : [];
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn('[store] could not read scores file:', err.message);
    }
  }

  function scheduleSave() {
    if (!persist || saveTimer) return;
    saveTimer = setTimeout(async () => {
      saveTimer = null;
      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const tmp = filePath + '.tmp';
        await fs.writeFile(tmp, JSON.stringify({ best: [...best.values()], log }));
        await fs.rename(tmp, filePath);
      } catch (err) {
        console.error('[store] could not save scores file:', err.message);
      }
    }, 500);
  }

  function leaderboard() {
    if (!sorted) {
      sorted = [...best.values()].sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
    }
    return sorted;
  }

  return {
    kind: persist ? 'file' : 'memory',

    async hit(key, windowSeconds) {
      const now = Date.now();
      const entry = counters.get(key);
      if (!entry || entry.expiresAt <= now) {
        counters.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
        return 1;
      }
      entry.count += 1;
      return entry.count;
    },

    async claimOnce(key, ttlSeconds) {
      const now = Date.now();
      const exp = once.get(key);
      if (exp && exp > now) return false;
      once.set(key, now + ttlSeconds * 1000);
      return true;
    },

    async submitScore(record) {
      await load();
      const current = best.get(record.nickname);
      const isNewBest = !current || record.score > current.score;
      if (isNewBest) {
        best.set(record.nickname, record);
        sorted = null;
      }
      log.unshift(record);
      if (log.length > LOG_LIMIT) log.length = LOG_LIMIT;
      scheduleSave();
      const list = leaderboard();
      const index = list.findIndex((r) => r.nickname === record.nickname);
      return { rank: index + 1, best: list[index].score, isNewBest };
    },

    async top(limit) {
      await load();
      return leaderboard()
        .slice(0, limit)
        .map((r, i) => ({ rank: i + 1, nickname: r.nickname, score: r.score }));
    },

    async player(nickname) {
      await load();
      const list = leaderboard();
      const index = list.findIndex((r) => r.nickname === nickname);
      if (index === -1) return null;
      return { nickname, score: list[index].score, rank: index + 1 };
    },
  };
}

let store = null;

export function getStore() {
  if (store) return store;
  if (REDIS_URL && REDIS_TOKEN) {
    store = createRedisStore();
  } else {
    const onVercel = Boolean(process.env.VERCEL);
    if (onVercel) {
      console.warn('[store] No Redis configured on Vercel: scores are kept in memory and WILL be lost.');
    }
    store = createLocalStore({ persist: !onVercel });
  }
  return store;
}
