import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

const webServerEnv: Record<string, string> = {
  NODE_ENV: 'development',
  PORT: port,
  SESSION_SECRET: process.env.SESSION_SECRET ?? 'e2e-session-secret-minimum-32-characters',
  APP_URL: baseURL,
  SMS_PROVIDER: 'mock',
  PAYMENT_PROVIDER: 'mock',
  ALLOW_MOCK_PAYMENT: 'true',
  ALLOW_DEV_OTP_CODE: 'true',
  CAPTCHA_PROVIDER: 'stub',
  NEXT_PUBLIC_CAPTCHA_PROVIDER: 'stub',
};

if (process.env.CI) {
  webServerEnv.DATABASE_URL =
    process.env.DATABASE_URL ??
    'postgresql://invitation_user:invitation_pass@127.0.0.1:5432/invitation_db';
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 90_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  snapshotPathTemplate: '{testDir}/snapshots/{testFilePath}/{arg}{ext}',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: webServerEnv,
  },
});
