/**
 * Visual audit phase 3 — remaining matrix + edge cases
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(process.cwd(), 'docs', 'visual-audit', '2026-07-10');
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

fs.mkdirSync(OUT, { recursive: true });

async function setLocale(ctx, locale) {
  await ctx.addCookies([{ name: 'locale', value: locale, domain: '127.0.0.1', path: '/' }]);
}

async function shot(page, name, opts = {}) {
  const p = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: p, fullPage: opts.fullPage ?? true, clip: opts.clip, animations: 'disabled' });
  console.log('saved', name);
}

async function loginOtp(page) {
  const suffix = String(Date.now()).slice(-7).padStart(7, '0');
  const phone = `+7 (707) ${suffix.slice(0, 3)}-${suffix.slice(3, 5)}-${suffix.slice(5)}`;
  const otpRes = await page.request.post('/api/auth/request-otp', { data: { phone } });
  const { devCode } = await otpRes.json();
  await page.request.post('/api/auth/verify-otp', { data: { phone, code: String(devCode) } });
}

async function dismissGuest(page) {
  const openBtn = page.getByRole('button', { name: /Открыть приглашение|Ашу/i });
  if (await openBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByRole('button', { name: /Без музыки/i }).click().catch(() => {});
    await openBtn.click();
  }
  const sheet = page.getByTestId('guest-music-sheet');
  if (await sheet.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByRole('button', { name: /Без музыки/i }).click();
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE });

// Settings page
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await loginOtp(page);
  await page.goto('/settings');
  await page.waitForTimeout(1500);
  await shot(page, 'settings-m390-ru');
  await page.close();
}

// Quick edit full scroll + pay sheet clip
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/invitations/quick?template=wedding-luxury');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await shot(page, 'quick-edit-full-m390-ru');
  const payBtn = page.getByRole('button', { name: /Оплатить публикацию/i }).first();
  if (await payBtn.isVisible().catch(() => false)) {
    await payBtn.scrollIntoViewIfNeeded();
    await shot(page, 'quick-edit-pay-cta-clip-m390-ru', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  }
  await page.close();
}

// Family preview via API
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await loginOtp(page);

  const tplRes = await page.request.get('/api/templates');
  const tplBody = await tplRes.json();
  const wedding = (tplBody.templates ?? tplBody.data ?? []).find((t) => t.slug === 'wedding-luxury');
  if (!wedding?.id) {
    console.log('family-preview skip: no template id', tplRes.status());
  } else {
    const createRes = await page.request.post('/api/invitations', {
      data: {
        title: 'Айгүл & Нұрлан',
        eventType: 'wedding',
        eventDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        eventTime: '18:00',
        eventPlace: 'Ресторан Астана',
        templateId: wedding.id,
        templateKey: 'wedding-luxury',
      },
    });
    if (!createRes.ok()) {
      console.log('family-preview create failed', createRes.status(), await createRes.text());
    } else {
      const { invitation } = await createRes.json();
      const fpRes = await page.request.post(`/api/invitations/${invitation.id}/family-preview`, { data: {} });
      if (fpRes.ok()) {
        const { url } = await fpRes.json();
        await page.goto(url.replace(/^https?:\/\/[^/]+/, ''));
        await page.waitForTimeout(3000);
        await dismissGuest(page);
        await shot(page, 'family-preview-m390-ru');
      } else {
        console.log('family-preview token failed', fpRes.status());
      }
    }
  }
  await page.close();
}

// Demo long names via API override not available — editor new with long names in URL N/A
// Cover empty: new editor without photo
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/invitations/new?template=wedding-luxury');
  await page.waitForTimeout(3000);
  const gotIt = page.getByRole('button', { name: /Понятно/i });
  if (await gotIt.isVisible({ timeout: 2000 }).catch(() => false)) await gotIt.click();
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(800);
  await shot(page, 'draft-editor-cover-region-m390-ru', { fullPage: false, clip: { x: 0, y: 0, width: 390, height: 844 } });
  await page.close();
}

// Blog desktop
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1024, height: 900 });
  await setLocale(ctx, 'ru');
  await page.goto('/blog');
  await page.waitForTimeout(1500);
  await shot(page, 'blog-d1024-ru');
  await page.close();
}

await browser.close();
console.log('phase3 done');
