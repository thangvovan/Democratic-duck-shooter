import { allowMethods, getClientIp, sendJson, withErrors } from '../../lib/http.js';
import { rateLimit } from '../../lib/rateLimit.js';
import { getStore } from '../../lib/store.js';
import { isValidNickname, sanitizeNickname } from '../../public/src/data/rules.js';

// GET /api/leaderboard/:nickname -> { nickname, score, rank }
export default withErrors(async (req, res) => {
  if (!allowMethods(req, res, ['GET'])) return;
  if (!(await rateLimit(res, 'leaderboard', getClientIp(req)))) return;

  const nickname = sanitizeNickname(String(req.query?.nickname ?? ''));
  if (!isValidNickname(nickname)) return sendJson(res, 400, { error: 'Invalid nickname' });

  const entry = await getStore().player(nickname);
  if (!entry) return sendJson(res, 404, { error: 'Player not found' });
  sendJson(res, 200, entry);
});
