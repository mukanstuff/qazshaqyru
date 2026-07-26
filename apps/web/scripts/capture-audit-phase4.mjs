/**
 * Visual audit phase 4 — post-fix verification matrix
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
  const musicOff = page.getByRole('button', { name: /Без музыки|Музыкасыз/i });
  if (await musicOff.isVisible({ timeout: 2000 }).catch(() => false)) {
    await musicOff.click();
  }
  const envelope = page.locator('[data-section="envelope-intro"] button, .guest-envelope__cta').first();
  if (await envelope.isVisible({ timeout: 2000 }).catch(() => false)) {
    await envelope.click();
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE });

// Landing reduced motion
{
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/');
  await page.waitForTimeout(2500);
  await shot(page, 'landing-reduced-motion-fixed-m390-ru');
  await page.close();
}

// Family preview post-fix
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await loginOtp(page);
  const tplRes = await page.request.get('/api/templates');
  const tplBody = await tplRes.json();
  const wedding = (tplBody.templates ?? tplBody.data ?? []).find((t) => t.slug === 'wedding-luxury');
  if (wedding?.id) {
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
    if (createRes.ok()) {
      const { invitation } = await createRes.json();
      const fpRes = await page.request.post(`/api/invitations/${invitation.id}/family-preview`, { data: {} });
      if (fpRes.ok()) {
        const { url } = await fpRes.json();
        await page.goto(url.replace(/^https?:\/\/[^/]+/, ''));
        await page.waitForTimeout(3000);
        await dismissGuest(page);
        await shot(page, 'family-preview-fixed-m390-ru');
      }
    }
  }
  await page.close();
}

// Quick edit pay footer
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/invitations/quick?template=wedding-luxury');
  await page.waitForTimeout(2000);
  await shot(page, 'quick-edit-full-fixed-m390-ru');
  await page.locator('#qe-groomName, input').first().fill('Нурлан');
  const bride = page.locator('#qe-brideName');
  if (await bride.count()) await bride.fill('Айгерим');
  await page.waitForTimeout(500);
  await shot(page, 'quick-edit-pay-cta-fixed-m390-ru', {
    fullPage: false,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  await page.close();
}

// Demo KZ + tablet 768
for (const vp of [
  { w: 390, name: 'demo-wedding-luxury-fixed-m390-kz', locale: 'kz' },
  { w: 768, name: 'demo-wedding-luxury-fixed-m768-ru', locale: 'ru' },
]) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: vp.w, height: 900 });
  await setLocale(ctx, vp.locale);
  await page.goto('/i/demo?layout=wedding-luxury');
  await page.waitForTimeout(2500);
  await dismissGuest(page);
  await shot(page, vp.name);
  await page.close();
}

// Templates catalog with preview.jpg
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await setLocale(ctx, 'ru');
  await page.goto('/templates');
  await page.waitForTimeout(1500);
  await shot(page, 'templates-mobile-fixed-ru', { fullPage: false });
  await page.close();
}

await browser.close();
console.log('phase4 done');
