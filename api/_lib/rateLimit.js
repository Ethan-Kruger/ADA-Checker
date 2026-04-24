// Persistent rate limiter backed by Upstash Redis.
// Falls back to in-memory if KV env vars are not configured (local dev).

let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { Redis } = require('@upstash/redis');
    kv = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
  }
} catch (_) {}

// In-memory fallback for local dev (per-instance, not distributed)
const memStore = new Map();

function memRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  let entry = memStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    memStore.set(key, entry);
  }
  entry.count += 1;
  if (memStore.size > 5000) {
    for (const [k, v] of memStore) {
      if (now > v.resetAt) memStore.delete(k);
    }
  }
  return { limited: entry.count > maxRequests, remaining: Math.max(0, maxRequests - entry.count) };
}

/**
 * Rate limit by IP using Vercel KV sliding window counter.
 * @param {object} req
 * @param {string} prefix      - key prefix e.g. 'rl:login'
 * @param {number} maxRequests
 * @param {number} windowMs
 * @returns {Promise<{ limited: boolean, remaining: number }>}
 */
async function rateLimit(req, prefix, maxRequests, windowMs) {
  const ip  = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
              || req.socket?.remoteAddress
              || 'unknown';
  const key = `${prefix}:${ip}`;

  if (!kv) return memRateLimit(key, maxRequests, windowMs);

  const windowSec = Math.ceil(windowMs / 1000);

  // Atomic increment + set TTL if key is new
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, windowSec);

  return {
    limited:   count > maxRequests,
    remaining: Math.max(0, maxRequests - count),
  };
}

// ── Account lockout ────────────────────────────────────────────────────────────
const LOCKOUT_THRESHOLD = 10;   // failed attempts before lockout
const LOCKOUT_SECS      = 15 * 60; // 15 minutes

/**
 * Record a failed login attempt for a user ID.
 * Returns true if the account should now be locked.
 */
async function recordFailedLogin(userId) {
  const key = `lockout:${userId}`;
  if (!kv) return false; // skip in local dev

  const attempts = await kv.incr(key);
  if (attempts === 1) await kv.expire(key, LOCKOUT_SECS);
  return attempts >= LOCKOUT_THRESHOLD;
}

/**
 * Check if a user is currently locked out.
 * Returns { locked: boolean, ttl: number } — ttl is seconds remaining.
 */
async function isLockedOut(userId) {
  if (!kv) return { locked: false, ttl: 0 };
  const key      = `lockout:${userId}`;
  const attempts = await kv.get(key);
  if (!attempts || Number(attempts) < LOCKOUT_THRESHOLD) return { locked: false, ttl: 0 };
  const ttl = await kv.ttl(key);
  return { locked: true, ttl: Math.max(0, ttl) };
}

/**
 * Clear lockout after a successful login.
 */
async function clearLockout(userId) {
  if (!kv) return;
  await kv.del(`lockout:${userId}`);
}

module.exports = { rateLimit, recordFailedLogin, isLockedOut, clearLockout };
