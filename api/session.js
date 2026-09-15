import { allowMethods, getClientIp, sendJson, withErrors } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import { issueToken } from '../lib/token.js';

// POST /api/session -> { token } used later to submit the final score.
export default withErrors(async (req, res) => {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!(await rateLimit(res, 'session', getClientIp(req)))) return;
  const { token } = issueToken();
  sendJson(res, 200, { token });
});
