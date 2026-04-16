// Shared CORS + security headers helper
// Sets Access-Control-Allow-Origin to the configured APP_URL instead of *.

const ALLOWED_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');

function applyHeaders(req, res) {
  const origin = req.headers['origin'] || '';

  // Allow same-origin and the configured app URL only
  if (ALLOWED_ORIGIN && origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  } else if (!ALLOWED_ORIGIN) {
    // Dev fallback — no APP_URL configured
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Security headers on every API response
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

module.exports = { applyHeaders };
