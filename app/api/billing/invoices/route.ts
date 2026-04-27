import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import stripe from '@/lib/stripe';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', payload.sub)
    .single();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ invoices: [] });
  }

  const list = await stripe.invoices.list({
    customer: sub.stripe_customer_id,
    limit: 24,
  });

  const invoices = list.data.map((inv) => ({
    id: inv.id,
    date: inv.created,
    amount: inv.amount_paid,
    currency: inv.currency,
    status: inv.status,
    pdf: inv.invoice_pdf,
  }));

  return NextResponse.json({ invoices });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
