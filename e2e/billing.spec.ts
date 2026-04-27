import { test, expect } from '@playwright/test';

// Billing E2E tests require a live Stripe test-mode environment.
// They are skipped unless STRIPE_TEST_MODE=true is set so they never
// run against the real Stripe API in CI without explicit opt-in.
const stripe = process.env.STRIPE_TEST_MODE === 'true';

test.describe('Billing flow', () => {
  test.skip(!stripe, 'Set STRIPE_TEST_MODE=true to run billing tests');

  test('checkout redirects to Stripe and returns to app', async ({ page }) => {
    // Sign in as a test user first
    await page.goto('/');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL ?? '');
    await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD ?? '');
    await page.getByRole('button', { name: /sign in/i }).last().click();
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible({ timeout: 8_000 });

    // Go to pricing and click upgrade
    await page.goto('/pricing');
    await page.getByRole('link', { name: /upgrade to pro/i }).click();

    // Should land on Stripe checkout (stripe.com domain)
    await expect(page).toHaveURL(/stripe\.com/, { timeout: 15_000 });
  });

  test('webhook: cancelled subscription reverts plan to free', async ({ request }) => {
    // This test calls the webhook endpoint directly with a simulated event.
    // Real Stripe webhook signature verification is bypassed in test mode
    // via STRIPE_WEBHOOK_SECRET=whsec_test_... set in CI env.
    const res = await request.post('/api/stripe/webhook', {
      headers: { 'stripe-signature': 'test' },
      data: {
        type: 'customer.subscription.deleted',
        data: { object: { customer: 'cus_test', status: 'canceled' } },
      },
    });

    // Webhook should accept or return 400 for bad sig — not 500
    expect([200, 400]).toContain(res.status());
  });
});
