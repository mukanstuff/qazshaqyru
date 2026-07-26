import { test, expect } from '@playwright/test';

const TEMPLATE_SLUG = 'wedding-luxury';

test.describe('templates → live editor → publish readiness', () => {
  test('user can start from catalog and finish guided start', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const quickLink = page.getByTestId(`template-quick-${TEMPLATE_SLUG}`);
    await expect(quickLink).toBeVisible();
    await Promise.all([
      page.waitForURL(new RegExp(`/invitations/edit\\?template=${TEMPLATE_SLUG}`)),
      quickLink.click(),
    ]);
    await expect(page.getByTestId('live-editor-guided')).toBeVisible();

    await page.getByTestId('live-editor-guided-groom').fill('Нұрлан');
    await page.getByTestId('live-editor-guided-bride').fill('Айгүл');
    await page.getByTestId('live-editor-guided-next').click();

    await page.getByTestId('live-editor-guided-date').fill('2030-12-31');
    await page.getByTestId('live-editor-guided-next').click();
    await page.getByTestId('live-editor-guided-next').click();
    await page.getByTestId('live-editor-guided-finish').click();

    await expect(page.getByTestId('live-editor-publish')).toBeVisible();
    await expect(page.getByTestId('live-editor-preview').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Айгүл/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
