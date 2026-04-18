import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

const PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};

export async function POST(req: NextRequest) {
  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { plan } = body as { plan?: string };
  const priceId = plan ? PRICE_IDS[plan] : undefined;

  if (!priceId) {
    return NextResponse.json(
      { error: 'Invalid plan. Must be "pro" or "enterprise"' },
      { status: 400 }
    );
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', payload.sub)
    .single();

  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', payload.sub)
      .single();

    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { user_id: payload.sub },
    });
    customerId = customer.id;

    await supabase
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', payload.sub);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?upgrade=success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { user_id: payload.sub, plan: plan! },
      subscription_data: {
        metadata: { user_id: payload.sub, plan: plan! },
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe checkout error:', message);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
