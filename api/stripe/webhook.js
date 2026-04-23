const stripe   = require('../_lib/stripe');
const supabase = require('../_lib/supabase');

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function planFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID)        return 'pro';
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return 'enterprise';
  return 'free';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig     = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // Log internally but never send err.message to client
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const obj = event.data.object;

  switch (event.type) {

    // Fires immediately when checkout completes — update plan right away
    case 'checkout.session.completed': {
      if (obj.mode !== 'subscription') break;
      const userId = obj.metadata?.user_id;
      const plan   = obj.metadata?.plan;
      if (!userId || !plan) break;

      await supabase
        .from('subscriptions')
        .update({
          plan,
          status:                 'active',
          stripe_subscription_id: obj.subscription,
          stripe_customer_id:     obj.customer,
        })
        .eq('user_id', userId);
      break;
    }

    case 'invoice.payment_succeeded': {
      const subscription = await stripe.subscriptions.retrieve(obj.subscription);
      const priceId      = subscription.items?.data?.[0]?.price?.id;
      const plan         = planFromPriceId(priceId);
      const userId       = subscription.metadata?.user_id;
      if (!userId || !priceId) break;

      await supabase
        .from('subscriptions')
        .update({
          plan,
          status:                 'active',
          stripe_subscription_id: subscription.id,
          current_period_end:     new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('user_id', userId);
      break;
    }

    case 'invoice.payment_failed': {
      const subscription = await stripe.subscriptions.retrieve(obj.subscription);
      const userId       = subscription.metadata?.user_id;
      if (!userId) break;

      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('user_id', userId);
      break;
    }

    case 'customer.subscription.deleted': {
      const userId = obj.metadata?.user_id;
      if (!userId) break;

      await supabase
        .from('subscriptions')
        .update({
          plan:                   'free',
          status:                 'canceled',
          stripe_subscription_id: null,
          current_period_end:     null,
        })
        .eq('user_id', userId);
      break;
    }

    case 'customer.subscription.updated': {
      const priceId = obj.items?.data?.[0]?.price?.id;
      const plan    = planFromPriceId(priceId);
      const userId  = obj.metadata?.user_id;
      if (!userId || !priceId) break;

      await supabase
        .from('subscriptions')
        .update({
          plan,
          status:             obj.status,
          current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
        })
        .eq('user_id', userId);
      break;
    }

    default:
      break;
  }

  return res.status(200).json({ received: true });
};
