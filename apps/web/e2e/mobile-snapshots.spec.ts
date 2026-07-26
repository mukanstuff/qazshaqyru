import { test, expect } from '@playwright/test';
import { assertDemoInvitationLoaded, waitForDemoInvitationReady } from './helpers/demo-invitation';
import { completeQuickWizardToPreview } from './helpers/wizard';

test.describe('mobile viewport snapshots', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  test('/i/demo guest invitation', async ({ page }) => {
    await waitForDemoInvitationReady(page, 'wedding-luxury');
    await assertDemoInvitationLoaded(page);

    await expect(page).toHaveScreenshot('guest-demo-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('live editor preview', async ({ page }) => {
    await completeQuickWizardToPreview(page);
    await expect(page.getByTestId('live-editor-preview').first()).toBeVisible();

    await expect(page).toHaveScreenshot('editor-preview-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('flagship wedding-luxury demo', async ({ page }) => {
    await waitForDemoInvitationReady(page, 'wedding-luxury');
    await assertDemoInvitationLoaded(page);

    await expect(page).toHaveScreenshot('flagship-wedding-luxury-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});
