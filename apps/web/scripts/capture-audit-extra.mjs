/**
 * One-off extra visual audit captures — 2026-07-10
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(process.cwd(), 'docs', 'visual-audit', '2026-07-10');
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { w: 360, h: 800, label: 'm360' },
  { w: 390, h: 844, label: 'm390' },
  { w: 430, h: 932, label: 'm430' },
  { w: 1024, h: 900, label: 'd1024' },
];

async function setLocale(ctx, locale) {
  await ctx.addCookies([{ name: 'locale', value: locale, domain: '127.0.0.1', path: '/' }]);
}

async function shot(page, name, opts = {}) {
  fs.mkdirSync(OUT, { recursive: true });
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: opts.fullPage ?? true, clip: opts.clip, animations: 'disabled' });
  console.log('saved', p);
}

async function dismissOverlays(page) {
  const openBtn = page.getByRole('button', { name: /Открыть приглашение|Ашу/i });
  if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await openBtn.click();
    await openBtn.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  const sheet = page.getByTestId('guest-music-sheet');
  if (await sheet.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByRole('button', { name: /Без музыки/i }).click();
    await sheet.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
}

async function loginOtp(page) {
  const phone = `+7 (707) ${String(Date.now()).slice(-7).padStart(7, '0').slice(0, 3)}-${String(Date.now()).slice(-4).slice(0, 2)}-${String(Date.now()).slice(-2)}`;
  const otpRes = await page.request.post('/api/auth/request-otp', { data: { phone } });
  const { devCode } = await otpRes.json();
  await page.request.post('/api/auth/verify-otp', { data: { phone, code: String(devCode) } });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE });

for (const vp of VIEWPORTS) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await setLocale(ctx, 'ru');

  // Demo invitation
  await page.goto('/i/demo?layout=wedding-luxury');
  await page.waitForResponse((r) => r.url().includes('/api/invitations/public/demo') && r.status() === 200, { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await dismissOverlays(page);
  await shot(page, `demo-wedding-luxury-${vp.label}-ru`);

  // Quick wizard (current route)
  await page.goto('/invitations/quick?template=wedding-luxury');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await shot(page, `quick-wizard-step1-${vp.label}-ru`);

  // Draft editor
  await page.goto('/invitations/new?template=wedding-luxury');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await shot(page, `draft-editor-${vp.label}-ru`);

  await page.close();
}

// Dashboard after login (390 + 1024)
for (const vp of [VIEWPORTS[1], VIEWPORTS[3]]) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await setLocale(ctx, 'ru');
  await loginOtp(page);
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await shot(page, `dashboard-${vp.label}-ru`);
  await page.close();
}

// Demo banner clip 360
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 360, height: 800 });
  await setLocale(ctx, 'ru');
  await page.goto('/i/demo?layout=wedding-luxury');
  await page.waitForTimeout(3000);
  await dismissOverlays(page);
  const banner = page.getByTestId('demo-cta-banner');
  if (await banner.isVisible().catch(() => false)) {
    await shot(page, 'demo-banner-clip-m360-ru', { fullPage: false, clip: { x: 0, y: 0, width: 360, height: 220 } });
  }
  await page.close();
}

await browser.close();
console.log('done');
