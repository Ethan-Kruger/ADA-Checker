import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireAuth, buildClearCookie } from '@/lib/auth';
import stripe from '@/lib/stripe';

export async function DELETE(req: NextRequest) {
  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Fetch subscription so we can cancel in Stripe before deleting the DB row
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id, stripe_customer_id')
    .eq('user_id', payload.sub)
    .single();

  // Cancel active Stripe subscription so the customer is not billed again
  if (sub?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    } catch (err) {
      // Log but don't block deletion — subscription may already be canceled
      console.error('Stripe cancel error during account deletion:', err);
    }
  }

  // Deleting the user cascades to subscriptions and api_keys (FK ON DELETE CASCADE)
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', payload.sub);

  if (error) {
    console.error('delete-account error:', error.code);
    return NextResponse.json({ error: 'Failed to delete account', code: 'SERVER_ERROR' }, { status: 500 });
  }

  // Clear the session cookie
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', buildClearCookie());
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
