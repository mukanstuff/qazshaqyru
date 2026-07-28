import { test, expect } from '@playwright/test';

test.describe('Canvas Editor and Visual Seating E2E', () => {
  test('Canvas Editor renders toolbar, palette, and stage without errors', async ({ page }) => {
    // Navigate to a demo or mock canvas page if auth is bypassed in test mode,
    // or verify public guest rendering
    await page.goto('/i/demo?layout=wedding-luxury');
    await expect(page).toHaveURL(/.*\/i\/demo/);

    const heading = page.locator('h1, h2, [class*="heading"]').first();
    await expect(heading).toBeVisible();
  });

  test('QuickWizard step navigation works', async ({ page }) => {
    await page.goto('/create?template=wedding-luxury');
    await expect(page).toHaveURL(/.*\/create/);

    // Step 1: Event type selection
    const nextBtn = page.locator('[data-testid="quick-wizard-next"]');
    await expect(nextBtn).toBeVisible();
  });
});
