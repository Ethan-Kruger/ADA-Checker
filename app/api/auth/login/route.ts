import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import supabase from '@/lib/supabase';
import { signToken, buildTokenCookie } from '@/lib/auth';
import { rateLimit, recordFailedLogin, isLockedOut, clearLockout } from '@/lib/rateLimit';

// Dummy hash used when user is not found.
// Ensures bcrypt always runs so response time is identical for
// "user not found" vs "wrong password" — prevents email enumeration via timing.
const DUMMY_HASH = '$2b$12$invalidhashvaluethatisusedtopreventitenumerationattacks0';

export async function POST(req: NextRequest) {
  const { limited } = await rateLimit(req, 'rl:login', 10, 60 * 1000);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, email, password_hash, token_version')
    .eq('email', email.toLowerCase().trim())
    .single();

  const invalid = () => NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  // Check lockout BEFORE bcrypt so locked accounts are rejected cheaply.
  // Only possible when user exists; non-existent emails can't be locked out.
  if (user) {
    const { locked, ttl } = await isLockedOut(user.id);
    if (locked) {
      const mins = Math.ceil(ttl / 60);
      return NextResponse.json(
        {
          error: `Account temporarily locked due to too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`,
        },
        { status: 423 }
      );
    }
  }

  // Always run bcrypt — even when user is not found — to prevent timing attacks
  // that would reveal whether an email address is registered.
  const hashToCompare = user?.password_hash ?? DUMMY_HASH;
  const match = await bcrypt.compare(password, hashToCompare);

  if (!user || !match) {
    if (user) await recordFailedLogin(user.id);
    return invalid();
  }

  await clearLockout(user.id);

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .single();

  const plan = sub?.plan || 'free';
  const token = signToken({ sub: user.id, email: user.email, ver: user.token_version ?? 0 });

  // Token goes in httpOnly cookie only — never exposed in response body
  const res = NextResponse.json({ user: { id: user.id, email: user.email }, plan });
  res.headers.set('Set-Cookie', buildTokenCookie(token));
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
