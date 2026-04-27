import { test, expect } from '@playwright/test';

const email = `e2e+${Date.now()}@example.com`;
const password = 'TestPass1';

test.describe('Auth flow', () => {
  test('sign up creates account and shows checker', async ({ page }) => {
    await page.goto('/');

    // Welcome gate shows "Create Free Account"
    await page.getByRole('button', { name: /create free account/i }).click();

    await page.locator('#ada-email').fill(email);
    await page.locator('#ada-password').fill(password);
    await page.getByRole('button', { name: /create account/i }).click();

    // After success, checker is visible (profile bubble in nav)
    await expect(page.locator('.nav-profile-bubble')).toBeVisible({ timeout: 10_000 });
  });

  test('log out clears session', async ({ page }) => {
    await page.goto('/');

    // Sign in via welcome gate
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.locator('#ada-email').fill(email);
    await page.locator('#ada-password').fill(password);
    await page.getByRole('button', { name: /^sign in$/i }).last().click();

    await expect(page.locator('.nav-profile-bubble')).toBeVisible({ timeout: 10_000 });

    // Open profile menu → sign out
    await page.locator('.nav-profile-bubble').click();
    await page.locator('.nav-profile-signout').click();

    // Welcome gate returns
    await expect(page.getByRole('button', { name: /create free account/i })).toBeVisible({ timeout: 5_000 });
  });

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.locator('#ada-email').fill(email);
    await page.locator('#ada-password').fill('WrongPass9');
    await page.getByRole('button', { name: /^sign in$/i }).last().click();

    await expect(page.locator('.ada-auth-error')).toBeVisible({ timeout: 5_000 });
  });
});
