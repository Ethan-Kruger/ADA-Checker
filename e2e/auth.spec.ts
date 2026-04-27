import { test, expect } from '@playwright/test';

// Unique email per run so tests are idempotent
const email = `e2e+${Date.now()}@example.com`;
const password = 'TestPass1';

test.describe('Auth flow', () => {
  test('sign up creates account and lands on checker', async ({ page }) => {
    await page.goto('/');

    // Open auth modal → sign up tab
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByRole('tab', { name: /sign up/i }).click();

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /create account/i }).click();

    // Modal closes; user is now logged in
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible({ timeout: 8_000 });
  });

  test('log out clears session', async ({ page }) => {
    // Log in first
    await page.goto('/');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).last().click();
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible({ timeout: 8_000 });

    // Log out
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible({ timeout: 5_000 });
  });

  test('wrong password returns error', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('WrongPass9');
    await page.getByRole('button', { name: /sign in/i }).last().click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5_000 });
  });
});
