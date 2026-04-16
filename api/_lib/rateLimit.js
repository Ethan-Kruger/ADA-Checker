// Simple in-memory rate limiter.
// NOTE: Vercel functions can run on multiple instances so this is per-instance,
// not global. Good enough to slow down basic brute-force — use Redis for strict
// production rate limiting.

const store = new Map(); // ip → { count, resetAt }

/**
 * @param {object} req
 * @param {number} maxRequests  - max allowed in the window
 * @param {number} windowMs     - rolling window in milliseconds
 * @returns {{ limited: boolean, remaining: number }}
 */
function rateLimit(req, maxRequests, windowMs) {
  const ip  = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const key = ip;

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;

  // Prune old entries occasionally to avoid unbounded memory growth
  if (store.size > 5000) {
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }

  return {
    limited:   entry.count > maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
  };
}

module.exports = { rateLimit };
