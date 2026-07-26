import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3001';
const outDir = path.join(process.cwd(), 'docs/visual-audit/2026-07-14');

const viewports = [
  { tag: 'mobile', width: 390, height: 844 },
  { tag: 'desktop', width: 1280, height: 800 },
];

async function shot(page, name, opts = {}) {
  const file = path.join(outDir, `${name}.png`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  console.log(`saved ${name}.png`);
  return file;
}

async function gotoSafe(page, urlPath) {
  await page.goto(`${baseURL}${urlPath}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  await page.waitForTimeout(1200);
}

async function tryLogin(page) {
  const suffix = String(Date.now()).slice(-7).padStart(7, '0');
  const phone = `+7 (707) ${suffix.slice(0, 3)}-${suffix.slice(3, 5)}-${suffix.slice(5)}`;
  try {
    const otpRes = await page.request.post(`${baseURL}/api/auth/request-otp`, {
      data: { phone },
      timeout: 30_000,
    });
    if (!otpRes.ok()) {
      console.log(`otp request failed: ${otpRes.status()}`);
      return false;
    }
    const otpData = await otpRes.json();
    if (!otpData.devCode) {
      console.log('no devCode — dashboard/settings may redirect to login');
      return false;
    }
    const verifyRes = await page.request.post(`${baseURL}/api/auth/verify-otp`, {
      data: { phone, code: String(otpData.devCode) },
      timeout: 30_000,
    });
    if (!verifyRes.ok()) {
      console.log(`otp verify failed: ${verifyRes.status()}`);
      return false;
    }
    console.log('logged in via OTP');
    return true;
  } catch (err) {
    console.log(`login error: ${err.message}`);
    return false;
  }
}

async function captureWizardSteps(page, tag, width, height) {
  await page.setViewportSize({ width, height });
  await gotoSafe(page, '/invitations/quick?template=wedding-luxury');
  await page.waitForSelector('[data-testid="quick-edit"]', { timeout: 90_000 }).catch(() => null);
  await shot(page, `quick-wizard-step1-who-${tag}-ru`);

  const groom = page.locator('#qe-groomName');
  const bride = page.locator('#qe-brideName');
  if (await groom.count()) await groom.fill('Абылай');
  if (await bride.count()) await bride.fill('Айгуль');
  const next = page.getByTestId('quick-edit-next');
  if (await next.isVisible().catch(() => false)) {
    await next.click();
    await page.waitForTimeout(1000);
    await shot(page, `quick-wizard-step2-when-${tag}-ru`);

    const venue = page.locator('#qe-venueName');
    if (await venue.count()) await venue.fill('Ресторан Астана');
    const date = page.locator('input[type="date"]');
    if (await date.count()) await date.fill('2030-12-31');
    const time = page.locator('input[type="time"]');
    if (await time.count()) await time.fill('18:00');
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(1000);
      await shot(page, `quick-wizard-step3-story-${tag}-ru`);
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await page.waitForTimeout(1000);
        await shot(page, `quick-wizard-step4-ready-${tag}-ru`);
      }
    }
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.localStorage.setItem('locale', 'ru');
  });

  const publicPages = [
    { path: '/templates', name: 'templates' },
    { path: '/login', name: 'login' },
    { path: '/invitations/quick?template=wedding-luxury', name: 'quick-edit' },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const p of publicPages) {
      await gotoSafe(page, p.path);
      if (p.name === 'quick-edit') {
        await page.waitForSelector('[data-testid="quick-edit"]', { timeout: 90_000 }).catch(() => null);
      }
      await shot(page, `${p.name}-${vp.tag}-ru`);
    }
  }

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await gotoSafe(page, '/invitations/quick?template=wedding-luxury');
    await page.waitForSelector('[data-testid="quick-edit"]', { timeout: 90_000 }).catch(() => null);
    await shot(page, `quick-edit-wizard-${vp.tag}-ru`);
  }

  for (const vp of viewports) {
    await captureWizardSteps(page, vp.tag, vp.width, vp.height);
  }

  const loggedIn = await tryLogin(page);
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await gotoSafe(page, '/dashboard');
    await shot(page, `dashboard-${vp.tag}-ru`);
    await gotoSafe(page, '/settings');
    await shot(page, `settings-${vp.tag}-ru`);
  }

  console.log(`auth=${loggedIn}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
