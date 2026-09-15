import { allowMethods, getClientIp, sendJson, withErrors } from '../../lib/http.js';
import { rateLimit } from '../../lib/rateLimit.js';
import { getStore } from '../../lib/store.js';

// GET /api/leaderboard?limit=10 -> { entries: [{ rank, nickname, score }] }
export default withErrors(async (req, res) => {
  if (!allowMethods(req, res, ['GET'])) return;
  if (!(await rateLimit(res, 'leaderboard', getClientIp(req)))) return;

  const requested = Number.parseInt(req.query?.limit, 10);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 20) : 10;
  const entries = await getStore().top(limit);

  // Let the CDN absorb bursts: the leaderboard may be a few seconds stale.
  sendJson(res, 200, { entries }, { 'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=20' });
});
