import { expect, type Page } from '@playwright/test';
import { dismissGuestOverlays } from './auth';

const DEFAULT_TEMPLATE = 'wedding-luxury';

const DEMO_TITLE = /Айгерим|Айгерім/i;

/**
 * Wait until demo guest invitation content is loaded (not loading shell).
 * Use before guest/demo screenshots in e2e baselines.
 */
export async function waitForDemoInvitationReady(page: Page, slug?: string): Promise<void> {
  const layout = slug ?? DEFAULT_TEMPLATE;
  const apiPattern = `/api/invitations/public/demo?layout=${encodeURIComponent(layout)}`;

  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes(apiPattern) && resp.status() === 200,
      { timeout: 20_000 },
    ),
    page.goto(`/i/demo?layout=${encodeURIComponent(layout)}`),
  ]).catch(async () => {
    await page.goto(`/i/demo?layout=${encodeURIComponent(layout)}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/invitations/public/demo') && resp.status() === 200,
      { timeout: 20_000 },
    );
  });

  await expect(page.locator('.guest-loading')).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator('.guest-page:not(.guest-loading)')).toBeVisible({ timeout: 10_000 });

  const envelopeBtn = page.getByRole('button', { name: /Нажмите, чтобы открыть|Ашу үшін басыңыз/i });
  if (await envelopeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await envelopeBtn.click();
  }

  await expect(page.getByTestId('demo-cta-banner')).toBeVisible({ timeout: 10_000 });

  const titlePattern = DEMO_TITLE;
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('body')).toContainText(titlePattern, { timeout: 15_000 });

  await dismissGuestOverlays(page);
  await page.waitForTimeout(500);
}

/** Fail CI if loading shell is still visible at screenshot time. */
export async function assertDemoInvitationLoaded(page: Page): Promise<void> {
  await expect(page.locator('.guest-loading')).toHaveCount(0, { timeout: 5_000 });
  await expect(page.locator('.guest-page:not(.guest-loading)')).toBeVisible({ timeout: 5_000 });
}
