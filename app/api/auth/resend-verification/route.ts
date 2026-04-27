import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/email';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { limited } = await rateLimit(req, 'rl:resend-verify', 3, 10 * 60 * 1000);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many resend attempts. Please wait and try again.', code: 'RATE_LIMITED' },
      { status: 429 }
    );
  }

  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, email, email_verified')
    .eq('id', payload.sub)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  if (user.email_verified) {
    return NextResponse.json({ error: 'Email is already verified', code: 'CONFLICT' }, { status: 409 });
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS).toISOString();

  await supabase
    .from('users')
    .update({ verification_token: verificationToken, verification_token_expires_at: verificationTokenExpiresAt })
    .eq('id', user.id);

  sendVerificationEmail(user.email, verificationToken).catch((err: unknown) => {
    console.error('Failed to resend verification email:', err);
  });

  return NextResponse.json({ ok: true });
}
