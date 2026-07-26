import { test, expect } from '@playwright/test';
import { loginViaOtp, dismissGuestOverlays } from './helpers/auth';
import { completeQuickWizardToPreview, publishViaMockPayment } from './helpers/wizard';

test.describe('critical path: login → publish → guest RSVP', () => {
  test('OTP login reaches dashboard', async ({ page }) => {
    await loginViaOtp(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('live editor freemium publish', async ({ page }) => {
    await loginViaOtp(page);
    await completeQuickWizardToPreview(page);
    const { slug } = await publishViaMockPayment(page);
    await expect(page.getByText(/Опубликовано|опубликовано/i).first()).toBeVisible({ timeout: 10_000 });

    const publicRes = await page.request.get(`/api/invitations/public/${slug}`);
    expect(publicRes.ok()).toBeTruthy();
  });

  test('guest RSVP on published invitation', async ({ page }) => {
    test.setTimeout(120_000);
    await loginViaOtp(page);
    await completeQuickWizardToPreview(page);
    const { invitationId, slug } = await publishViaMockPayment(page);

    const publicRes = await page.request.get(`/api/invitations/public/${slug}`);
    expect(publicRes.ok()).toBeTruthy();

    const guestRes = await page.request.post('/api/guests', {
      data: { invitationId, name: `Е2Е Гость ${Date.now()}` },
    });
    expect(guestRes.ok()).toBeTruthy();
    const guestData = (await guestRes.json()) as { guest: { id: string; token: string } };
    expect(guestData.guest.token.length).toBeGreaterThan(10);

    const sendRes = await page.request.post(`/api/invitations/${invitationId}/send`, {
      data: { guestIds: [guestData.guest.id] },
    });
    expect(sendRes.ok()).toBeTruthy();
    const sendBody = (await sendRes.json()) as {
      guests: Array<{ inviteUrl: string }>;
    };
    const inviteUrl = sendBody.guests[0]?.inviteUrl;
    expect(inviteUrl).toBeTruthy();
    const guestToken = new URL(inviteUrl!).searchParams.get('guest');
    expect(guestToken?.length).toBeGreaterThan(10);

    const rsvpRes = await page.request.post('/api/rsvp', {
      data: {
        guestToken,
        status: 'attending',
      },
    });
    expect(rsvpRes.ok()).toBeTruthy();
    const rsvpBody = (await rsvpRes.json()) as { response?: { status: string } };
    expect(rsvpBody.response?.status).toBe('attending');
  });
});
