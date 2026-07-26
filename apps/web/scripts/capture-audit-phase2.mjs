/**
 * Visual audit phase 2 — edge cases, clips, KZ, modal, motion checks
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(process.cwd(), 'docs', 'visual-audit', '2026-07-10');
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

async function setLocale(ctx, locale) {
  await ctx.addCookies([{ name: 'locale', value: locale, domain: '127.0.0.1', path: '/' }]);
}

async function shot(page, name, opts = {}) {
  fs.mkdirSync(OUT, { recursive: true });
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({
    path: p,
    fullPage: opts.fullPage ?? false,
    clip: opts.clip,
    animations: 'disabled',
  });
  console.log('saved', p);
}

async function dismissGuest(page) {
  const openBtn = page.getByRole('button', { name: /Открыть приглашение|Ашу/i });
  if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await openBtn.click();
    await openBtn.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  const sheet = page.getByTestId('guest-music-sheet');
  if (await sheet.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByRole('button', { name: /Без музыки/i }).click();
    await sheet.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
}

async function loginOtp(page) {
  const suffix = String(Date.now()).slice(-7).padStart(7, '0');
  const phone = `+7 (707) ${suffix.slice(0, 3)}-${suffix.slice(3, 5)}-${suffix.slice(5)}`;
  const otpRes = await page.request.post('/api/auth/request-otp', { data: { phone } });
  const { devCode } = await otpRes.json();
  await page.request.post('/api/auth/verify-otp', { data: { phone, code: String(devCode) } });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE });

// 1) Demo venue clip — map button verification
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/i/demo?layout=wedding-luxury');
  await page.waitForResponse(
    (r) => r.url().includes('/api/invitations/public/demo') && r.status() === 200,
    { timeout: 25000 },
  );
  await page.waitForTimeout(1500);
  await dismissGuest(page);
  const venue = page.locator('[data-section="venue-map"]');
  await venue.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const box = await venue.boundingBox();
  if (box) {
    await shot(page, 'clip-demo-venue-map-m390-ru', {
      clip: {
        x: Math.max(0, box.x - 8),
        y: Math.max(0, box.y - 8),
        width: Math.min(390, box.width + 16),
        height: Math.min(600, box.height + 16),
      },
    });
  }
  await page.close();
}

// 2) Demo cover / hero media clip
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/i/demo?layout=wedding-luxury');
  await page.waitForResponse(
    (r) => r.url().includes('/api/invitations/public/demo') && r.status() === 200,
    { timeout: 25000 },
  );
  await dismissGuest(page);
  for (const sel of ['[data-section="cover-photo"]', '[data-section="hero-names"]', '.inv-manifest-hero__media']) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      await el.scrollIntoViewIfNeeded();
      const box = await el.boundingBox();
      if (box) {
        await shot(page, `clip-demo-${sel.replace(/[^a-z]+/gi, '-')}-m390-ru`, {
          clip: {
            x: Math.max(0, box.x),
            y: Math.max(0, box.y),
            width: Math.min(390, box.width),
            height: Math.min(500, box.height),
          },
        });
      }
    }
  }
  await page.close();
}

// 3) Demo KZ locale
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'kz');
  await page.goto('/i/demo?layout=wedding-luxury&locale=kz');
  await page.waitForResponse(
    (r) => r.url().includes('/api/invitations/public/demo') && r.status() === 200,
    { timeout: 25000 },
  );
  await page.waitForTimeout(1500);
  await dismissGuest(page);
  await shot(page, 'demo-wedding-luxury-m390-kz', { fullPage: true });
  await page.close();
}

// 4) Template preview modal
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await setLocale(ctx, 'ru');
  await page.goto('/templates');
  await page.getByTestId('templates-search-input').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Превью|Предпросмотр/i }).first().click();
  await page.waitForTimeout(2000);
  await shot(page, 'modal-template-preview-desktop-ru', { fullPage: false });
  await page.close();
}

// 5) Landing — hero wait + scroll sections
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/');
  await page.getByTestId('hero-product-frame').waitFor({ timeout: 15000 });
  await page.waitForTimeout(2500);
  await shot(page, 'landing-hero-wait-m390-ru', {
    fullPage: false,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await shot(page, 'landing-scrolled-bottom-m390-ru', { fullPage: false, clip: { x: 0, y: 0, width: 390, height: 844 } });
  const how = page.locator('#how');
  await how.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await shot(page, 'landing-how-section-m390-ru', { fullPage: false, clip: { x: 0, y: 0, width: 390, height: 844 } });
  await page.close();
}

// 6) Reduced motion landing
{
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/');
  await page.waitForTimeout(2000);
  await shot(page, 'landing-reduced-motion-m390-ru', { fullPage: true });
  await page.close();
}

// 7) Quick edit KZ + long names via query not available — fill in page
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'kz');
  await page.goto('/invitations/quick?template=wedding-luxury');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  const namesInput = page.locator('input').filter({ hasText: '' }).first();
  const nameField = page.locator('#qe-coupleNames, input[name="coupleNames"], input').nth(0);
  // try manifest couple field
  const couple = page.locator('input[id^="qe-"]').first();
  if (await couple.isVisible().catch(() => false)) {
    await couple.fill('Құдайберген & Айжан');
  }
  await shot(page, 'quick-edit-m390-kz', { fullPage: true });
  await page.close();
}

// 8) Editor — dismiss onboarding then capture
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/invitations/new?template=wedding-luxury');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  const gotIt = page.getByRole('button', { name: /Понятно|Түсінікті/i });
  if (await gotIt.isVisible({ timeout: 3000 }).catch(() => false)) {
    await gotIt.click();
    await page.waitForTimeout(500);
  }
  await shot(page, 'draft-editor-no-onboarding-m390-ru', {
    fullPage: false,
    clip: { x: 0, y: 0, width: 390, height: 320 },
  });
  await page.close();
}

// 9) Mock payment
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/mock-payment?orderId=demo-order&token=demo-token');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);
  await shot(page, 'mock-payment-m390-ru', { fullPage: true });
  await page.close();
}

// 10) Family preview flow (create draft + get link)
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await loginOtp(page);
  const createRes = await page.request.post('/api/invitations', {
    data: {
      templateKey: 'wedding-luxury',
      title: 'Айгүл & Нұрлан',
      eventType: 'wedding',
      eventDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '18:00',
      eventPlace: 'Ресторан Астана',
      language: 'ru',
    },
  });
  if (createRes.ok()) {
    const { invitation } = await createRes.json();
    const fpRes = await page.request.post(`/api/invitations/${invitation.id}/family-preview`, {
      data: {},
    });
    if (fpRes.ok()) {
      const { url } = await fpRes.json();
      const rel = url.replace(/^https?:\/\/[^/]+/, '');
      await page.goto(rel);
      await page.waitForTimeout(3000);
      await dismissGuest(page);
      await shot(page, 'family-preview-m390-ru', { fullPage: true });
    } else {
      console.log('family-preview API failed', fpRes.status());
    }
  } else {
    console.log('create invitation failed', createRes.status());
  }
  await page.close();
}

await browser.close();
console.log('phase2 done');
