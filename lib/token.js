// Signed, single-use game session tokens (HMAC-SHA256). Issued when a game starts and
// required to submit a score, so scores need a real game session of plausible length.

import crypto from 'node:crypto';

const DEV_SECRET = 'dev-only-secret-change-me';
let warned = false;

function getSecret() {
  const secret = process.env.SCORE_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (!warned) {
    warned = true;
    console.warn(
      `[token] SCORE_SECRET is ${secret ? `too short (${secret.length} chars, need 16+)` : 'missing'}; ` +
        'using an insecure development secret.',
    );
  }
  return DEV_SECRET;
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function signature(payloadPart) {
  return crypto.createHmac('sha256', getSecret()).update(payloadPart).digest();
}

export function issueToken() {
  const payload = { jti: crypto.randomBytes(16).toString('hex'), iat: Date.now() };
  const payloadPart = b64url(JSON.stringify(payload));
  return { token: `${payloadPart}.${b64url(signature(payloadPart))}`, payload };
}

export function verifyToken(token) {
  if (typeof token !== 'string' || token.length > 256) return null;
  const [payloadPart, sigPart] = token.split('.');
  if (!payloadPart || !sigPart) return null;

  const expected = signature(payloadPart);
  const given = Buffer.from(sigPart, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    if (typeof payload.jti !== 'string' || !Number.isFinite(payload.iat)) return null;
    return payload;
  } catch {
    return null;
  }
}
