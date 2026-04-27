import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

let kv: Redis | null = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kv = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
} catch (_) {}

// ─── IP extraction ──────────────────────────────────────────────────────────
// On Vercel the platform appends the real client IP as the LAST entry in
// x-forwarded-for. Taking the first entry is spoofable — an attacker can
// prepend a fake IP (e.g. "X-Forwarded-For: 1.2.3.4"). We take the last
// entry which is always set by the Vercel edge and cannot be forged.
function extractIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  if (forwarded) {
    const parts = forwarded.split(',');
    return parts[parts.length - 1].trim();
  }
  return 'unknown';
}

// ─── In-memory rate-limit store (dev fallback) ──────────────────────────────
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
  return {
    limited: entry.count > maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    limit: maxRequests,
    resetAt: entry.resetAt,
  };
}

// ─── In-memory lockout store (used when KV is unavailable) ─────────────────
// Still provides brute-force protection in dev or during a KV outage.
const memLockout = new Map<string, { attempts: number; resetAt: number }>();

const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_SECS = 15 * 60;
const LOCKOUT_MS = LOCKOUT_SECS * 1000;

// ─── Public API ─────────────────────────────────────────────────────────────

export async function rateLimit(
  req: NextRequest,
  prefix: string,
  maxRequests: number,
  windowMs: number
) {
  const ip = extractIp(req);
  const key = `${prefix}:${ip}`;

  if (!kv) return memRateLimit(key, maxRequests, windowMs);

  const windowSec = Math.ceil(windowMs / 1000);
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, windowSec);

  return {
    limited: count > maxRequests,
    remaining: Math.max(0, maxRequests - count),
    limit: maxRequests,
    resetAt: Date.now() + windowMs, // approximate — within one window
  };
}

export async function recordFailedLogin(userId: string) {
  if (kv) {
    const key = `lockout:${userId}`;
    const attempts = await kv.incr(key);
    if (attempts === 1) await kv.expire(key, LOCKOUT_SECS);
    return attempts >= LOCKOUT_THRESHOLD;
  }
  // In-memory fallback — still protects during dev / KV outage
  const now = Date.now();
  let entry = memLockout.get(userId);
  if (!entry || now > entry.resetAt) {
    entry = { attempts: 0, resetAt: now + LOCKOUT_MS };
    memLockout.set(userId, entry);
  }
  entry.attempts += 1;
  return entry.attempts >= LOCKOUT_THRESHOLD;
}

export async function isLockedOut(userId: string) {
  if (kv) {
    const key = `lockout:${userId}`;
    const attempts = await kv.get<number>(key);
    if (!attempts || Number(attempts) < LOCKOUT_THRESHOLD) return { locked: false, ttl: 0 };
    const ttl = await kv.ttl(key);
    return { locked: true, ttl: Math.max(0, ttl) };
  }
  // In-memory fallback
  const now = Date.now();
  const entry = memLockout.get(userId);
  if (!entry || entry.attempts < LOCKOUT_THRESHOLD || now > entry.resetAt) {
    return { locked: false, ttl: 0 };
  }
  return { locked: true, ttl: Math.ceil((entry.resetAt - now) / 1000) };
}

export async function clearLockout(userId: string) {
  if (kv) {
    await kv.del(`lockout:${userId}`);
    return;
  }
  memLockout.delete(userId);
}
