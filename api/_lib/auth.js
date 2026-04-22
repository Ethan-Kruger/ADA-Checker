const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = '7d';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

// Extracts and verifies the JWT from either the httpOnly cookie or the
// Authorization: Bearer header (header kept for backwards-compat during migration).
// Returns the decoded payload or throws if invalid/missing.
function requireAuth(req) {
  // 1. Prefer httpOnly cookie (XSS-safe)
  const cookieHeader = req.headers['cookie'] || '';
  const cookieMatch  = cookieHeader.match(/(?:^|;\s*)ada-token=([^;]+)/);
  const cookieToken  = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

  // 2. Fall back to Bearer header (legacy / API clients)
  const authHeader   = req.headers['authorization'] || '';
  const bearerToken  = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const token = cookieToken || bearerToken;
  if (!token) {
    const err = new Error('Missing authorization token');
    err.status = 401;
    throw err;
  }
  return verifyToken(token);
}

// Builds the Set-Cookie value for the JWT.
function buildTokenCookie(token) {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  return `ada-token=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

// Cookie that immediately expires — used to clear the session.
function buildClearCookie() {
  return 'ada-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

module.exports = { signToken, verifyToken, requireAuth, buildTokenCookie, buildClearCookie };
