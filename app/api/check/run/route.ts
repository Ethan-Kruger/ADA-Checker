import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const FREE_LIMIT = 10;
const WINDOW_MS  = 4 * 60 * 60 * 1000; // 4 hours

export async function POST(req: NextRequest) {
  // IP-level rate limit — prevents hammering the endpoint itself
  const { limited } = await rateLimit(req, 'rl:check-gate', 30, 60 * 1000);
  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch plan + check counts from Supabase (cannot be spoofed by client)
  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('plan, status, checks_today, checks_reset_at')
    .eq('user_id', payload.sub)
    .single();

  if (error || !sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  // Pro / Enterprise → unlimited
  if (sub.plan === 'pro' || sub.plan === 'enterprise') {
    return NextResponse.json({ ok: true, remaining: null });
  }

  // Free tier — check window + count
  const now        = Date.now();
  const resetAt    = sub.checks_reset_at ? new Date(sub.checks_reset_at).getTime() : 0;
  const windowExpired = now >= resetAt;

  let checksToday = windowExpired ? 0 : (sub.checks_today ?? 0);
  let newResetAt  = windowExpired ? new Date(now + WINDOW_MS).toISOString() : sub.checks_reset_at;

  if (checksToday >= FREE_LIMIT) {
    return NextResponse.json(
      {
        error: 'Limit reached',
        upgrade: true,
        resetAt: newResetAt,
        remaining: 0,
      },
      { status: 402 }
    );
  }

  // Increment count
  checksToday += 1;
  await supabase
    .from('subscriptions')
    .update({ checks_today: checksToday, checks_reset_at: newResetAt })
    .eq('user_id', payload.sub);

  return NextResponse.json({
    ok: true,
    remaining: FREE_LIMIT - checksToday,
    resetAt: newResetAt,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
