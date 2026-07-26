import { expect, type Page } from '@playwright/test';
import { dismissGuestOverlays } from './auth';

const DEFAULT_TEMPLATE = 'wedding-luxury';

/** Open Live Editor create path and complete guided start → ready to publish. */
export async function completeQuickWizardToPreview(
  page: Page,
  templateSlug = DEFAULT_TEMPLATE,
): Promise<void> {
  await page.goto(`/invitations/edit?template=${templateSlug}`);
  await expect(page.getByTestId('live-editor-guided')).toBeVisible({ timeout: 15_000 });

  await page.getByTestId('live-editor-guided-groom').fill('Нұрлан');
  await page.getByTestId('live-editor-guided-bride').fill('Айгүл');
  await page.getByTestId('live-editor-guided-next').click();

  await page.getByTestId('live-editor-guided-date').fill('2030-12-31');
  await page.getByTestId('live-editor-guided-next').click();

  // Cover step — skip upload
  await page.getByTestId('live-editor-guided-next').click();
  await page.getByTestId('live-editor-guided-finish').click();

  await expect(page.getByTestId('live-editor-publish')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('live-editor-preview').first()).toBeVisible();
  await dismissGuestOverlays(page);
}

/**
 * Freemium publish (watermark) via Live Editor.
 * Requires prior OTP login so save/publish can persist.
 */
export async function publishViaMockPayment(page: Page): Promise<{
  invitationId: string;
  slug: string;
}> {
  await dismissGuestOverlays(page);

  await page.getByTestId('live-editor-publish').click();
  await expect(page.getByTestId('live-editor-publish-confidence')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('live-editor-publish-confirm').click();

  await page.waitForURL(/\/invitations\/[^/?]+(\?|$)/, { timeout: 30_000 });
  const invitationId = page.url().match(/invitations\/([^/?]+)/)?.[1];
  expect(invitationId).toBeTruthy();

  const invRes = await page.request.get(`/api/invitations/${invitationId}`);
  expect(invRes.ok()).toBeTruthy();
  const invData = (await invRes.json()) as { invitation: { slug: string; status: string } };
  expect(invData.invitation.status).toBe('published');

  return { invitationId: invitationId!, slug: invData.invitation.slug };
}
