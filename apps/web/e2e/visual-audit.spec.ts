/**
 * Stage 1 visual audit harness — screenshots only, not CI baseline.
 * Output: apps/web/docs/visual-audit/YYYY-MM-DD/
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { dismissGuestOverlays, loginViaOtp } from './helpers/auth';
import { waitForDemoInvitationReady } from './helpers/demo-invitation';

const AUDIT_DATE = '2026-07-10';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'visual-audit', AUDIT_DATE);

const FLAGSHIP_SLUGS = ['wedding-luxury'] as const;

const VIEWPORTS = {
  mobile: { width: 390, height: 844, label: 'mobile' },
  desktop: { width: 1440, height: 900, label: 'desktop' },
} as const;

type ViewportKey = keyof typeof VIEWPORTS;
type Locale = 'ru' | 'kz';

function ensureOutputDir(): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function setLocale(page: Page, locale: Locale): Promise<void> {
  await page.context().addCookies([
    { name: 'locale', value: locale, domain: '127.0.0.1', path: '/' },
  ]);
}

async function auditScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean; clip?: { x: number; y: number; width: number; height: number } },
): Promise<string> {
  ensureOutputDir();
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({
    path: filePath,
    fullPage: options?.fullPage ?? true,
    clip: options?.clip,
    animations: 'disabled',
  });
  return `visual-audit/${AUDIT_DATE}/${name}.png`;
}

async function waitForLandingReady(page: Page): Promise<void> {
  await expect(page.getByTestId('hero-product-frame')).toBeVisible({ timeout: 15_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function captureSiteRoute(
  page: Page,
  routeName: string,
  url: string,
  viewport: ViewportKey,
  locale: Locale,
  waitFn?: (page: Page) => Promise<void>,
): Promise<string> {
  await page.setViewportSize(VIEWPORTS[viewport]);
  await setLocale(page, locale);
  await page.goto(url);
  if (waitFn) {
    await waitFn(page);
  } else {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
  }
  return auditScreenshot(page, `${routeName}-${viewport}-${locale}`);
}

test.describe.configure({ mode: 'serial' });

test.describe('visual audit — site vitrine', () => {
  test.beforeAll(() => ensureOutputDir());

  for (const viewport of ['mobile', 'desktop'] as const) {
    for (const locale of ['ru', 'kz'] as const) {
      test(`landing / — ${viewport} ${locale}`, async ({ page }) => {
        await captureSiteRoute(page, 'landing', '/', viewport, locale, waitForLandingReady);
      });

      test(`templates /templates — ${viewport} ${locale}`, async ({ page }) => {
        await captureSiteRoute(page, 'templates', '/templates', viewport, locale, async (p) => {
          await expect(p.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
          await expect(p.getByTestId('templates-search-input')).toBeVisible();
        });
      });

      test(`templates wedding /templates/wedding — ${viewport} ${locale}`, async ({ page }) => {
        await captureSiteRoute(
          page,
          'templates-wedding',
          '/templates/wedding',
          viewport,
          locale,
          async (p) => {
            await expect(p.getByTestId('category-templates-search-input')).toBeVisible({
              timeout: 15_000,
            });
          },
        );
      });

      test(`blog /blog — ${viewport} ${locale}`, async ({ page }) => {
        await captureSiteRoute(page, 'blog', '/blog', viewport, locale, async (p) => {
          await expect(p.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
        });
      });

      test(`terms /terms — ${viewport} ${locale}`, async ({ page }) => {
        await captureSiteRoute(page, 'terms', '/terms', viewport, locale);
      });

      test(`privacy /privacy — ${viewport} ${locale}`, async ({ page }) => {
        await captureSiteRoute(page, 'privacy', '/privacy', viewport, locale);
      });

      test(`login /login — ${viewport} ${locale}`, async ({ page }) => {
        await captureSiteRoute(page, 'login', '/login', viewport, locale, async (p) => {
          await expect(p.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
        });
      });

      test(`404 not-found — ${viewport} ${locale}`, async ({ page }) => {
        await captureSiteRoute(page, 'not-found', '/this-page-does-not-exist-404', viewport, locale);
      });
    }
  }

  test('templates search empty result — mobile ru', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await setLocale(page, 'ru');
    await page.goto('/templates');
    await expect(page.getByTestId('templates-search-input')).toBeVisible();
    await page.getByTestId('templates-search-input').fill('zzzznonexistenttemplate999');
    await page.waitForTimeout(500);
    await auditScreenshot(page, 'templates-search-empty-mobile-ru');
  });

  test('template preview modal — desktop ru', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await setLocale(page, 'ru');
    await page.goto('/templates');
    await expect(page.getByTestId('template-quick-wedding-luxury')).toBeVisible({ timeout: 15_000 });
    await page
      .getByRole('button', { name: /Превью|Предпросмотр|Алдын ала/i })
      .first()
      .click();
    await page.waitForTimeout(2000);
    await auditScreenshot(page, 'modal-template-preview-desktop-ru', { fullPage: false });
  });

  test('login modal via live editor publish — mobile ru', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await setLocale(page, 'ru');
    await page.goto('/invitations/edit?template=wedding-luxury');
    await expect(page.getByTestId('live-editor-guided')).toBeVisible();

    await page.getByTestId('live-editor-guided-groom').fill('Нұрлан');
    await page.getByTestId('live-editor-guided-bride').fill('Айгүл');
    await page.getByTestId('live-editor-guided-next').click();
    await page.getByTestId('live-editor-guided-date').fill('2030-12-31');
    await page.getByTestId('live-editor-guided-next').click();
    await page.getByTestId('live-editor-guided-next').click();
    await page.getByTestId('live-editor-guided-finish').click();

    await expect(page.getByTestId('live-editor-publish')).toBeVisible({ timeout: 15_000 });
    await dismissGuestOverlays(page);
    await page.getByTestId('live-editor-publish').click();
    await expect(page.getByTestId('live-editor-publish-confidence')).toBeVisible();
    await page.getByTestId('live-editor-publish-confirm').click();
    await page.waitForTimeout(800);
    await auditScreenshot(page, 'modal-login-mobile-ru', { fullPage: false });
  });

  const guidedSteps = ['who', 'when', 'cover', 'done'] as const;

  for (let step = 1; step <= guidedSteps.length; step++) {
    test(`live editor guided step ${step} — mobile ru`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await setLocale(page, 'ru');
      await page.goto('/invitations/edit?template=wedding-luxury');
      await expect(page.getByTestId('live-editor-guided')).toBeVisible();

      for (let i = 1; i < step; i++) {
        if (i === 1) {
          await page.getByTestId('live-editor-guided-groom').fill('Нұрлан');
          await page.getByTestId('live-editor-guided-bride').fill('Айгүл');
        }
        if (i === 2) {
          await page.getByTestId('live-editor-guided-date').fill('2030-12-31');
        }
        await page.getByTestId('live-editor-guided-next').click();
        await page.waitForTimeout(400);
      }

      await auditScreenshot(page, `wizard-step-${step}-mobile-ru`);
    });
  }

  test('live editor preview — mobile ru', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await setLocale(page, 'ru');
    await page.goto('/invitations/edit?template=wedding-luxury');
    await expect(page.getByTestId('live-editor-guided')).toBeVisible();
    await page.getByTestId('live-editor-guided-groom').fill('Нұрлан');
    await page.getByTestId('live-editor-guided-bride').fill('Айгүл');
    await page.getByTestId('live-editor-guided-next').click();
    await page.getByTestId('live-editor-guided-date').fill('2030-12-31');
    await page.getByTestId('live-editor-guided-next').click();
    await page.getByTestId('live-editor-guided-next').click();
    await page.getByTestId('live-editor-guided-finish').click();
    await expect(page.getByTestId('live-editor-preview').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.guest-loading')).toHaveCount(0, { timeout: 20_000 });
    await dismissGuestOverlays(page);
    await auditScreenshot(page, 'wizard-preview-mobile-ru');
  });

  test('live editor /invitations/edit — desktop ru', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await setLocale(page, 'ru');
    await page.goto('/invitations/edit?template=wedding-luxury');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    await auditScreenshot(page, 'draft-editor-desktop-ru');
  });

  test('dashboard — mobile ru (OTP)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await setLocale(page, 'ru');
    await loginViaOtp(page);
    await page.waitForTimeout(1000);
    await auditScreenshot(page, 'dashboard-mobile-ru');
  });

  test('dashboard — desktop ru (OTP)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await setLocale(page, 'ru');
    await loginViaOtp(page);
    await page.waitForTimeout(1000);
    await auditScreenshot(page, 'dashboard-desktop-ru');
  });

  test('settings — mobile ru (OTP)', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await setLocale(page, 'ru');
    await loginViaOtp(page);
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await auditScreenshot(page, 'settings-mobile-ru');
  });

  test('mock-payment — mobile ru', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await setLocale(page, 'ru');
    await page.goto('/mock-payment?orderId=demo-order&token=demo-token');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    await auditScreenshot(page, 'mock-payment-mobile-ru');
  });

  test('demo banner clipping check — mobile ru', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await setLocale(page, 'ru');
    await waitForDemoInvitationReady(page, 'wedding-luxury');
    const banner = page.getByTestId('demo-cta-banner');
    await expect(banner).toBeVisible();
    await auditScreenshot(page, 'demo-banner-mobile-ru', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 390, height: 200 },
    });
  });
});

test.describe('visual audit — flagship templates', () => {
  test.beforeAll(() => ensureOutputDir());

  for (const slug of FLAGSHIP_SLUGS) {
    test(`flagship ${slug} — mobile ru`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);
      await setLocale(page, 'ru');
      await waitForDemoInvitationReady(page, slug);
      await auditScreenshot(page, `template-${slug}-mobile-ru`);
    });

    test(`flagship ${slug} — desktop ru`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await setLocale(page, 'ru');
      await waitForDemoInvitationReady(page, slug);
      await auditScreenshot(page, `template-${slug}-desktop-ru`);
    });
  }

  test('demo default /i/demo loading vs content — mobile ru', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await setLocale(page, 'ru');

    await page.goto('/i/demo');
    await expect(page.getByTestId('demo-cta-banner')).toBeVisible({ timeout: 10_000 });
    const loadingVisible = await page.locator('.guest-loading').isVisible().catch(() => false);
    if (loadingVisible) {
      await auditScreenshot(page, 'demo-loading-state-mobile-ru');
    }

    await page.waitForResponse(
      (resp) => resp.url().includes('/api/invitations/public/demo') && resp.status() === 200,
      { timeout: 20_000 },
    );
    await expect(page.locator('.guest-loading')).toHaveCount(0, { timeout: 20_000 });
    await dismissGuestOverlays(page);
    await auditScreenshot(page, 'demo-loaded-content-mobile-ru');
  });
});
