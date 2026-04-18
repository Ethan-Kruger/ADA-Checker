import { NextRequest } from 'next/server';

let kv: typeof import('@vercel/kv').kv | null = null;
try {
  if (process.env.KV_REST_API_URL) {
    kv = require('@vercel/kv').kv;
  }
} catch (_) {}

// In-memory fallback for local dev
const memStore = new Map<string, { count: number; resetAt: number }>();

function memRateLimit(key: string, maxRequests: number, windowMs: number) {
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

export async function rateLimit(
  req: NextRequest,
  prefix: string,
  maxRequests: number,
  windowMs: number
) {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || 'unknown';
  const key = `${prefix}:${ip}`;

  if (!kv) return memRateLimit(key, maxRequests, windowMs);

  const windowSec = Math.ceil(windowMs / 1000);
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, windowSec);

  return {
    limited: count > maxRequests,
    remaining: Math.max(0, maxRequests - count),
  };
}

const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_SECS = 15 * 60;

export async function recordFailedLogin(userId: string) {
  if (!kv) return false;
  const key = `lockout:${userId}`;
  const attempts = await kv.incr(key);
  if (attempts === 1) await kv.expire(key, LOCKOUT_SECS);
  return attempts >= LOCKOUT_THRESHOLD;
}

export async function isLockedOut(userId: string) {
  if (!kv) return { locked: false, ttl: 0 };
  const key = `lockout:${userId}`;
  const attempts = await kv.get<number>(key);
  if (!attempts || Number(attempts) < LOCKOUT_THRESHOLD) return { locked: false, ttl: 0 };
  const ttl = await kv.ttl(key);
  return { locked: true, ttl: Math.max(0, ttl) };
}

export async function clearLockout(userId: string) {
  if (!kv) return;
  await kv.del(`lockout:${userId}`);
}
