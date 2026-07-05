import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Requires a running app with a live env (Clerk test user, DB, AI
 * keys). Run with `npm run test:e2e`. Not part of the unit suite (`npm test`),
 * which stays hermetic. Auth is handled via a stored Clerk session state; see
 * tests/e2e/README for setup once you wire a test account.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
