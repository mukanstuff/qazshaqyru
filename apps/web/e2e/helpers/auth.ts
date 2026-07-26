import { expect, type Page } from '@playwright/test';

/** Unique KZ phone for isolated OTP rate limits (+77XXXXXXXXX). */
export function uniqueKzPhone(): string {
  const suffix = String(Date.now()).slice(-7).padStart(7, '0');
  return `+7 (707) ${suffix.slice(0, 3)}-${suffix.slice(3, 5)}-${suffix.slice(5)}`;
}

/** Dismiss guest envelope animation if it blocks the page. */
export async function dismissGuestEnvelopeIfPresent(page: Page): Promise<void> {
  const openBtn = page.getByRole('button', { name: /Открыть приглашение|Ашу/i });
  if (await openBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await openBtn.click();
    await expect(openBtn).toBeHidden({ timeout: 5_000 });
  }
}

/** Dismiss optional music prompt bottom sheet on guest/preview layouts. */
export async function dismissGuestMusicSheetIfPresent(page: Page): Promise<void> {
  const sheet = page.getByTestId('guest-music-sheet');
  if (await sheet.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await page.getByRole('button', { name: /Без музыки/i }).click();
    await expect(sheet).toBeHidden({ timeout: 5_000 });
  }
}

export async function dismissGuestOverlays(page: Page): Promise<void> {
  await dismissGuestEnvelopeIfPresent(page);
  await dismissGuestMusicSheetIfPresent(page);
}

/**
 * OTP login via API (shares cookies with page) then open dashboard.
 * Requires ALLOW_DEV_OTP_CODE + NODE_ENV=development in webServer env.
 */
export async function loginViaOtp(page: Page, phone?: string): Promise<string> {
  const testPhone = phone ?? uniqueKzPhone();

  const otpRes = await page.request.post('/api/auth/request-otp', {
    data: { phone: testPhone },
  });
  expect(otpRes.ok()).toBeTruthy();
  const otpData = (await otpRes.json()) as { devCode?: string };
  expect(otpData.devCode, 'devCode must be exposed in e2e (NODE_ENV=development)').toBeTruthy();

  const verifyRes = await page.request.post('/api/auth/verify-otp', {
    data: { phone: testPhone, code: String(otpData.devCode) },
  });
  expect(verifyRes.ok()).toBeTruthy();

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  return testPhone;
}
