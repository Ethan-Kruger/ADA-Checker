import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import supabase from '@/lib/supabase';
import { signToken, buildTokenCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const { limited } = await rateLimit(req, 'rl:signup', 5, 10 * 60 * 1000);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please wait and try again.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json(
      { error: 'Password must contain at least one uppercase letter' },
      { status: 400 }
    );
  }
  if (!/[0-9]/.test(password)) {
    return NextResponse.json(
      { error: 'Password must contain at least one number' },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 }
    );
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ email: email.toLowerCase().trim(), password_hash })
    .select('id, email, created_at')
    .single();

  if (userErr || !user) {
    console.error('signup user error:', userErr?.code ?? 'UNKNOWN');
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }

  await supabase
    .from('subscriptions')
    .insert({ user_id: user.id, plan: 'free', status: 'active' });

  const token = signToken({ sub: user.id, email: user.email, ver: 0 });

  // Token goes in httpOnly cookie only — never exposed in response body
  const res = NextResponse.json(
    { user: { id: user.id, email: user.email }, plan: 'free' },
    { status: 201 }
  );
  res.headers.set('Set-Cookie', buildTokenCookie(token));
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
