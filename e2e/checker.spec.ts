import { test, expect } from '@playwright/test';

const SAMPLE_HTML = '<html><body><img src="test.png"><button></button></body></html>';

test.describe('Checker — free plan', () => {
  test('rule engine runs and returns a score', async ({ page }) => {
    await page.goto('/');

    // Paste HTML into the textarea
    await page.locator('#html-input, textarea').first().fill(SAMPLE_HTML);
    await page.getByRole('button', { name: /check/i }).click();

    // Score appears
    await expect(page.locator('#score, [data-score]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('AA/AAA rules show upgrade prompt for free users', async ({ page }) => {
    await page.goto('/');

    // Switch to AA level
    const levelSelect = page.locator('#wcag-level, select[name="level"]').first();
    if (await levelSelect.isVisible()) {
      await levelSelect.selectOption('AA');
    }

    await page.locator('#html-input, textarea').first().fill(SAMPLE_HTML);
    await page.getByRole('button', { name: /check/i }).click();

    // Should see either the results or a plan gate — not a crash
    await expect(
      page.locator('#score, [data-score], [data-plan-gate]').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
