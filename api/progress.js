import { allowMethods, getClientIp, getJsonBody, sendJson, withErrors } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import { getStore } from '../lib/store.js';
import { verifyToken } from '../lib/token.js';
import { isValidNickname, sanitizeNickname } from '../public/src/data/rules.js';

const MAX_LIVE_SCORE = 100_000;

// POST /api/progress  { token, nickname, score, stage, done? }
// Marks a player as "currently playing" for the live scoreboard. These numbers are NOT
// validated and never reach the real leaderboard; only /api/scores can do that.
export default withErrors(async (req, res) => {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!(await rateLimit(res, 'progress', getClientIp(req)))) return;

  const body = getJsonBody(req);
  if (!body) return sendJson(res, 400, { error: 'Invalid JSON body' });
  if (!verifyToken(body.token)) return sendJson(res, 401, { error: 'Invalid game session' });

  const nickname = sanitizeNickname(body.nickname);
  if (!isValidNickname(nickname)) return sendJson(res, 400, { error: 'Invalid nickname' });

  const store = getStore();
  if (body.done === true) {
    await store.removeLive(nickname);
    return sendJson(res, 200, { ok: true, live: false });
  }

  const score = Number(body.score);
  const stage = Number(body.stage);
  if (!Number.isInteger(score) || score < 0 || score > MAX_LIVE_SCORE) {
    return sendJson(res, 422, { error: 'Invalid score' });
  }
  await store.setLive(nickname, { score, stage: Number.isInteger(stage) ? stage : 0, at: Date.now() });
  sendJson(res, 200, { ok: true, live: true });
});
