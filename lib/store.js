// Persistence layer.
// - Production: Redis via REDIS_URL (redis:// or rediss://), using the `redis` package.
// - Local (no REDIS_URL): JSON file in ./data (in-memory only when running on Vercel without Redis).

import { promises as fs } from 'node:fs';
import path from 'node:path';

const PREFIX = 'lsd:';
const LEADERBOARD_KEY = PREFIX + 'leaderboard';
const BEST_META_KEY = PREFIX + 'best';
const LOG_KEY = PREFIX + 'scores';
const LIVE_KEY = PREFIX + 'live';
const LOG_LIMIT = 5000;
// Players still playing disappear from the live board if they stop sending updates.
export const LIVE_MAX_AGE_MS = 10 * 60 * 1000;

const REDIS_URL = process.env.REDIS_URL;

// One client per function instance, reused across requests.
function createRedisPipeline() {
  let clientPromise = null;

  function getClient() {
    if (!clientPromise) {
      clientPromise = import('redis')
        .then(({ createClient }) => {
          const client = createClient({
            url: REDIS_URL,
            RESP: 2, // flat arrays and string scores, as the code below expects
            // Give up quickly instead of retrying forever, so a bad URL fails the request fast.
            socket: {
              connectTimeout: 5000,
              reconnectStrategy: (retries) => (retries >= 2 ? new Error('Redis unreachable') : 200),
            },
          });
          client.on('error', (err) => console.error('[store] redis error:', err.message));
          return client.connect().then(() => client);
        })
        .catch((err) => {
          clientPromise = null; // retry on the next request
          throw err;
        });
    }
    return clientPromise;
  }

  return async function pipeline(commands) {
    const client = await getClient();
    // Commands sent in the same tick are automatically pipelined by node-redis.
    const work = Promise.all(commands.map((cmd) => client.sendCommand(cmd.map(String))));
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Redis command timed out')), 5000);
    });
    try {
      return await Promise.race([work, timeout]);
    } finally {
      clearTimeout(timer);
    }
  };
}

function createRedisStore(pipeline) {
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

    // ---- players currently in a run (unvalidated, shown only on the live board) ----

    async setLive(nickname, entry) {
      await pipeline([['HSET', LIVE_KEY, nickname, JSON.stringify(entry)]]);
    },

    async removeLive(nickname) {
      await pipeline([['HDEL', LIVE_KEY, nickname]]);
    },

    async liveList(maxAgeMs = LIVE_MAX_AGE_MS) {
      const [flat] = await pipeline([['HGETALL', LIVE_KEY]]);
      const fresh = [];
      const stale = [];
      const now = Date.now();
      for (let i = 0; i < flat.length; i += 2) {
        try {
          const entry = JSON.parse(flat[i + 1]);
          if (now - entry.at > maxAgeMs) stale.push(flat[i]);
          else fresh.push({ nickname: flat[i], ...entry });
        } catch {
          stale.push(flat[i]);
        }
      }
      if (stale.length) await pipeline([['HDEL', LIVE_KEY, ...stale]]);
      return fresh;
    },
  };
}

function createLocalStore({ persist }) {
  const filePath = path.join(process.cwd(), 'data', 'scores.json');
  const best = new Map(); // nickname -> record
  const live = new Map(); // nickname -> { score, stage, at }
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
      for (const entry of data.live || []) live.set(entry.nickname, entry);
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
        await fs.writeFile(tmp, JSON.stringify({ best: [...best.values()], live: [...live.values()], log }));
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

    async setLive(nickname, entry) {
      await load();
      live.set(nickname, { nickname, ...entry });
      scheduleSave();
    },

    async removeLive(nickname) {
      await load();
      if (live.delete(nickname)) scheduleSave();
    },

    async liveList(maxAgeMs = LIVE_MAX_AGE_MS) {
      await load();
      const now = Date.now();
      let changed = false;
      for (const [nickname, entry] of live) {
        if (now - entry.at > maxAgeMs) {
          live.delete(nickname);
          changed = true;
        }
      }
      if (changed) scheduleSave();
      return [...live.values()];
    },
  };
}

let store = null;

export function getStore() {
  if (store) return store;
  if (REDIS_URL) {
    store = createRedisStore(createRedisPipeline());
  } else {
    const onVercel = Boolean(process.env.VERCEL);
    if (onVercel) {
      console.warn('[store] REDIS_URL is not set on Vercel: scores are kept in memory and WILL be lost.');
    }
    store = createLocalStore({ persist: !onVercel });
  }
  return store;
}
