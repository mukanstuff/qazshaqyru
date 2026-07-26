import { test, expect } from '@playwright/test';
import { loginViaOtp } from './helpers/auth';

test.describe('dashboard flow', () => {
  test('OTP login → stat cards or empty → create link → templates', async ({ page }) => {
    await loginViaOtp(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const statCards = page.locator('.font-display.text-3xl.font-semibold.text-us-accent');
    const hasStats = (await statCards.count()) > 0;
    if (hasStats) {
      await expect(statCards.first()).toBeVisible();
    }

    await page.getByRole('link', { name: /Создать/i }).first().click();
    await expect(page).toHaveURL(/\/templates/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
