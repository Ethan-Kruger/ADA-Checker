import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import supabase from '@/lib/supabase';

function planFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return 'enterprise';
  return 'free';
}

/**
 * Verify that the Stripe customer on a subscription belongs to the given user.
 * Prevents an attacker from crafting a subscription with a victim's user_id in
 * metadata and triggering a webhook that upgrades the victim's account.
 * Returns true when no customer is stored yet (first payment).
 */
async function verifyCustomerOwnership(
  userId: string,
  stripeCustomerId: string
): Promise<boolean> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (!sub?.stripe_customer_id) return true; // first payment — not stored yet
  return sub.stripe_customer_id === stripeCustomerId;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');

  // Reject immediately if signature header is absent.
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const obj = event.data.object as unknown as Record<string, unknown>;

  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const inv = obj as { subscription: string };
      const subscription = await stripe.subscriptions.retrieve(inv.subscription);
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const plan = planFromPriceId(priceId);
      const userId = subscription.metadata?.user_id;
      if (!userId || !priceId) break;

      if (!await verifyCustomerOwnership(userId, subscription.customer as string)) {
        console.error('Webhook customer mismatch — possible metadata tampering, userId:', userId);
        break;
      }

      await supabase
        .from('subscriptions')
        .update({
          plan,
          status: 'active',
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('user_id', userId);
      break;
    }

    case 'invoice.payment_failed': {
      const inv = obj as { subscription: string };
      const subscription = await stripe.subscriptions.retrieve(inv.subscription);
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      if (!await verifyCustomerOwnership(userId, subscription.customer as string)) {
        console.error('Webhook customer mismatch — possible metadata tampering, userId:', userId);
        break;
      }

      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('user_id', userId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = obj as { customer: string; metadata?: { user_id?: string } };
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      if (!await verifyCustomerOwnership(userId, sub.customer)) {
        console.error('Webhook customer mismatch — possible metadata tampering, userId:', userId);
        break;
      }

      await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'canceled',
          stripe_subscription_id: null,
          current_period_end: null,
        })
        .eq('user_id', userId);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = obj as {
        customer: string;
        items?: { data?: Array<{ price?: { id: string } }> };
        metadata?: { user_id?: string };
        status: string;
        current_period_end: number;
      };
      const priceId = sub.items?.data?.[0]?.price?.id;
      const plan = planFromPriceId(priceId || '');
      const userId = sub.metadata?.user_id;
      if (!userId || !priceId) break;

      if (!await verifyCustomerOwnership(userId, sub.customer)) {
        console.error('Webhook customer mismatch — possible metadata tampering, userId:', userId);
        break;
      }

      await supabase
        .from('subscriptions')
        .update({
          plan,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('user_id', userId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
