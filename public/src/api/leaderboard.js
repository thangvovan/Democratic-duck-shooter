// Client for the leaderboard API. Gameplay never talks to the server; only these calls do:
// one session at game start, one score submission at game end, and cached leaderboard reads.

const TIMEOUT_MS = 6000;
const LEADERBOARD_TTL_MS = 15000;

let cache = { at: 0, limit: 0, entries: null };
let inflight = null;

async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(data?.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw Object.assign(new Error('Request timed out'), { status: 0 });
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLeaderboard(limit = 10, { force = false } = {}) {
  const fresh = Date.now() - cache.at < LEADERBOARD_TTL_MS && cache.limit >= limit;
  if (!force && fresh && cache.entries) return cache.entries.slice(0, limit);
  if (inflight) return inflight;
  inflight = request(`/api/leaderboard?limit=${limit}`)
    .then((data) => {
      cache = { at: Date.now(), limit, entries: data.entries };
      return data.entries;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function invalidateLeaderboard() {
  cache = { at: 0, limit: 0, entries: null };
}

export async function fetchPlayer(nickname) {
  try {
    return await request(`/api/leaderboard/${encodeURIComponent(nickname)}`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function createSession() {
  const data = await request('/api/session', { method: 'POST' });
  return data.token;
}

// Live board only: "I am playing, this is my score right now". Never touches the real leaderboard.
export async function sendProgress(payload) {
  return request('/api/progress', { method: 'POST', body: payload });
}

export async function submitScore(payload) {
  const data = await request('/api/scores', { method: 'POST', body: payload });
  invalidateLeaderboard();
  return data;
}
