import { test, expect } from '@playwright/test';

/**
 * Public-surface smoke tests — no auth required. The authenticated per-mode
 * flows (research → scored tree → ideas, image upload, portfolio CSV) require a
 * stored Clerk session; add them under a `test.use({ storageState })` project
 * once a test account is wired.
 */

test('landing page renders the value proposition and CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/profitable niches/i);
  await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
});

test('health endpoint responds', async ({ request }) => {
  const res = await request.get('/api/health');
  // 200 when DB is up, 503 when down — both mean the route is wired.
  expect([200, 503]).toContain(res.status());
});

test('unauthenticated dashboard access redirects to sign-in', async ({ page }) => {
  await page.goto('/overview');
  await expect(page).toHaveURL(/sign-in/);
});
