import { allowMethods, getClientIp, getJsonBody, sendJson, withErrors } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import { getStore } from '../lib/store.js';
import { verifyToken } from '../lib/token.js';
import { validateSubmission } from '../lib/validate.js';
import { RULES, sanitizeNickname } from '../public/src/data/rules.js';

// POST /api/scores  { token, nickname, score, stats } -> { rank, best, isNewBest }
export default withErrors(async (req, res) => {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!(await rateLimit(res, 'scoreIp', getClientIp(req)))) return;

  const body = getJsonBody(req);
  if (!body) return sendJson(res, 400, { error: 'Invalid JSON body' });

  const tokenPayload = verifyToken(body.token);
  if (!tokenPayload) return sendJson(res, 401, { error: 'Invalid game session' });

  const nickname = sanitizeNickname(body.nickname);
  if (nickname && !(await rateLimit(res, 'scoreNickname', nickname))) return;

  const result = validateSubmission(body, tokenPayload);
  if (!result.ok) return sendJson(res, 422, { error: result.error });

  const store = getStore();
  const fresh = await store.claimOnce(`token:${tokenPayload.jti}`, RULES.MAX_GAME_SECONDS);
  if (!fresh) return sendJson(res, 409, { error: 'Score for this game was already submitted' });

  const { rank, best, isNewBest } = await store.submitScore(result.record);
  sendJson(res, 201, { nickname: result.record.nickname, score: result.record.score, rank, best, isNewBest });
});
