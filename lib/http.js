// Small helpers shared by API handlers. Uses only the plain Node http API so the
// same handlers run on Vercel serverless functions and on the local dev-server.js.

const TRUST_PROXY = Boolean(process.env.VERCEL) || process.env.TRUST_PROXY === '1';

export function getClientIp(req) {
  if (TRUST_PROXY) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim().slice(0, 64);
    }
    const real = req.headers['x-real-ip'];
    if (typeof real === 'string' && real.length > 0) return real.slice(0, 64);
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

export function sendJson(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!headers['Cache-Control']) res.setHeader('Cache-Control', 'no-store');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(body);
}

export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  sendJson(res, 405, { error: 'Method not allowed' });
  return false;
}

// Vercel parses JSON bodies into req.body; dev-server.js does the same. Accept a raw
// string too in case the content-type header was missing.
export function getJsonBody(req) {
  const body = req.body;
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  const text = Buffer.isBuffer(body) ? body.toString('utf8') : body;
  if (typeof text !== 'string' || text.length === 0 || text.length > 8192) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function withErrors(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('[api]', err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal server error' });
    }
  };
}
