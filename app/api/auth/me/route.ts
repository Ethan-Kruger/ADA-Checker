import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, email, created_at')
    .eq('id', payload.sub)
    .single();

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    user: { id: user.id, email: user.email, created_at: user.created_at },
    plan: sub?.plan || 'free',
    status: sub?.status || 'active',
    current_period_end: sub?.current_period_end || null,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
