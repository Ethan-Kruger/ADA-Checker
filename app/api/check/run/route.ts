import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { PLAN_CONFIG } from '@/lib/plans';

function rlHeaders(limit: number, remaining: number, resetAt: number) {
  return {
    'X-RateLimit-Limit':     String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset':     String(Math.ceil(resetAt / 1000)), // Unix seconds
  };
}

export async function POST(req: NextRequest) {
  // IP-level rate limit — prevents hammering the endpoint itself
  const ip = await rateLimit(req, 'rl:check-gate', 30, 60 * 1000);
  if (ip.limited) {
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMITED' },
      { status: 429, headers: rlHeaders(ip.limit, 0, ip.resetAt) }
    );
  }

  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Fetch plan + check counts from Supabase (cannot be spoofed by client)
  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('plan, status, checks_today, checks_reset_at')
    .eq('user_id', payload.sub)
    .single();

  if (error || !sub) {
    return NextResponse.json({ error: 'Subscription not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  // Pro / Enterprise → unlimited
  if (sub.plan === 'pro' || sub.plan === 'enterprise') {
    return NextResponse.json(
      { ok: true, remaining: null },
      { headers: { 'X-RateLimit-Limit': 'unlimited', 'X-RateLimit-Remaining': 'unlimited' } }
    );
  }

  // Free tier — check window + count
  const { uiChecksPerWindow, uiWindowMs } = PLAN_CONFIG.free;
  const now        = Date.now();
  const resetAt    = sub.checks_reset_at ? new Date(sub.checks_reset_at).getTime() : 0;
  const windowExpired = now >= resetAt;

  let checksToday = windowExpired ? 0 : (sub.checks_today ?? 0);
  let newResetAt  = windowExpired ? new Date(now + uiWindowMs).toISOString() : sub.checks_reset_at;

  const limit = uiChecksPerWindow ?? 0;

  if (checksToday >= limit) {
    return NextResponse.json(
      {
        error: 'Limit reached',
        code: 'LIMIT_REACHED',
        upgrade: true,
        resetAt: newResetAt,
        remaining: 0,
      },
      {
        status: 402,
        headers: rlHeaders(limit, 0, new Date(newResetAt as string).getTime()),
      }
    );
  }

  // Increment count
  checksToday += 1;
  await supabase
    .from('subscriptions')
    .update({ checks_today: checksToday, checks_reset_at: newResetAt })
    .eq('user_id', payload.sub);

  return NextResponse.json(
    {
      ok: true,
      remaining: limit - checksToday,
      resetAt: newResetAt,
    },
    { headers: rlHeaders(limit, limit - checksToday, new Date(newResetAt as string).getTime()) }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
