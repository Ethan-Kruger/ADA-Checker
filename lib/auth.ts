import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const SECRET = process.env.JWT_SECRET!;
// Fail fast at startup — a missing or short secret produces trivially forgeable tokens
if (!SECRET || SECRET.length < 32) {
  throw new Error('JWT_SECRET env var is missing or under 32 characters');
}
const EXPIRES_IN = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export interface JwtPayload {
  sub: string;
  email: string;
  ver: number; // token_version — incremented on password change to invalidate old tokens
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}

/** Cookie name used for the auth token. */
export const TOKEN_COOKIE = 'ada-token';

/**
 * Build a Set-Cookie string for the auth token.
 * Sets HttpOnly + Secure (in production) + SameSite=Strict.
 */
export function buildTokenCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  return `${TOKEN_COOKIE}=${encodeURIComponent(token)}; HttpOnly; ${secure}SameSite=Strict; Path=/; Max-Age=${COOKIE_MAX_AGE}`;
}

/** Cookie that immediately expires — clears the session. */
export function buildClearCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  return `${TOKEN_COOKIE}=; HttpOnly; ${secure}SameSite=Strict; Path=/; Max-Age=0`;
}

/**
 * Extracts and verifies the JWT from a Next.js App Router request.
 * Prefers the httpOnly cookie (browser clients); falls back to
 * Authorization: Bearer header (API / server-to-server clients).
 */
export function requireAuth(req: NextRequest): JwtPayload {
  // 1. Prefer httpOnly cookie — set by our login/signup routes
  const cookieToken = req.cookies.get(TOKEN_COOKIE)?.value ?? null;
  // 2. Fall back to Bearer header for API clients
  const header = req.headers.get('authorization') || '';
  const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : null;

  const token = cookieToken || bearerToken;
  if (!token) {
    const err = Object.assign(new Error('Missing authorization token'), { status: 401 });
    throw err;
  }
  return verifyToken(token);
}
