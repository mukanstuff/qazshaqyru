import { test, expect } from '@playwright/test';
import { loginViaOtp } from './helpers/auth';
import { completeQuickWizardToPreview, publishViaMockPayment } from './helpers/wizard';

test.describe('payment mock flow', () => {
  test('mock payment page confirms order and publishes invitation', async ({ page }) => {
    await loginViaOtp(page);
    await completeQuickWizardToPreview(page);
    const { invitationId } = await publishViaMockPayment(page);

    const invRes = await page.request.get(`/api/invitations/${invitationId}`);
    const invData = (await invRes.json()) as { invitation: { status: string } };
    expect(invData.invitation.status).toBe('published');
  });

  // Kaspi webhook path is covered by vitest integration tests
  // (orders/webhook/[provider]/__tests__/route.integration.test.ts).
  // Full webhook e2e needs live Kaspi createPayment — not feasible in CI mock mode.
});
