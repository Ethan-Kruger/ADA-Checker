import { test, expect, type Page } from '@playwright/test';

const SAMPLE_HTML = '<img src="test.png"><button></button>';

// Inject a fake user into localStorage so AuthGate shows the checker.
// Also pre-seed the plan cache so auth.js skips the /api/auth/me fetch
// (which would 401 without a cookie and trigger logout → reload).
async function bypassAuthGate(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('ada-user', JSON.stringify({ id: 'test', email: 'test@example.com' }));
    localStorage.setItem('ada-plan', 'pro');
    // Mark plan as freshly synced so auth.js cache is valid (TTL 5 min)
    localStorage.setItem('ada-plan-synced-at', String(Date.now()));
  });
}

// Mock API endpoints so the checker works without a real backend
async function mockCheckGate(page: Page) {
  await page.route('/api/check/run', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, remaining: 9, resetAt: null }),
    })
  );
  await page.route('/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'test', email: 'test@example.com' }, plan: 'pro' }),
    })
  );
}

test.describe('Checker — free plan', () => {
  test('rule engine runs and returns a score', async ({ page }) => {
    await bypassAuthGate(page);
    await mockCheckGate(page);
    await page.goto('/');

    // Wait for checker.js to expose window.checkAccessibilityAsync
    await page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).checkAccessibilityAsync === 'function',
      { timeout: 15_000 }
    );

    await page.locator('#html-input').fill(SAMPLE_HTML);
    await page.locator('#check-btn').click();

    await expect(page.locator('#results')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#score-number')).toBeVisible();
  });

  test('WCAG level selector is present', async ({ page }) => {
    await bypassAuthGate(page);
    await page.goto('/');

    await expect(page.locator('#main-wcag-level')).toBeVisible();
    await expect(page.locator('#main-wcag-level option[value="AA"]')).toHaveCount(1);
    await expect(page.locator('#main-wcag-level option[value="AAA"]')).toHaveCount(1);
  });
});
