import { getStore } from './store.js';
import { sendJson } from './http.js';

export const LIMITS = {
  leaderboard: { max: 60, windowSeconds: 60 },
  session: { max: 20, windowSeconds: 60 },
  scoreIp: { max: 6, windowSeconds: 60 },
  scoreNickname: { max: 3, windowSeconds: 60 },
};

// Fixed-window rate limiter. Returns true when the request may proceed;
// otherwise responds with 429 and returns false.
export async function rateLimit(res, limitName, identity) {
  if (process.env.RATE_LIMIT_DISABLED === '1') return true;
  const { max, windowSeconds } = LIMITS[limitName];
  const count = await getStore().hit(`${limitName}:${identity}`, windowSeconds);
  if (count <= max) return true;
  sendJson(res, 429, { error: 'Too many requests, slow down.' }, { 'Retry-After': String(windowSeconds) });
  return false;
}
