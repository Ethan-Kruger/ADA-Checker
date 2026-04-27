import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireAuth, buildClearCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Fetch user and verify token_version to reject sessions from before a
  // password change on other devices/browsers.
  const { data: user } = await supabase
    .from('users')
    .select('id, email, created_at, token_version, email_verified')
    .eq('id', payload.sub)
    .single();

  if (!user) return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });

  if ((payload.ver ?? 0) !== (user.token_version ?? 0)) {
    // Token is from before a password change — clear the stale cookie so the
    // browser doesn't keep sending it on every request.
    const res = NextResponse.json(
      { error: 'Session expired. Please log in again.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
    res.headers.set('Set-Cookie', buildClearCookie());
    return res;
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    user: { id: user.id, email: user.email, created_at: user.created_at, email_verified: user.email_verified ?? false },
    plan: sub?.plan || 'free',
    status: sub?.status || 'active',
    current_period_end: sub?.current_period_end || null,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
