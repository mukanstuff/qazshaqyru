import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const phase = process.env.AUDIT_PHASE ?? 'before';
const outDir = path.join(process.cwd(), 'docs/visual-audit/2026-07-21-ui-polish');

async function shot(page, name) {
  const file = path.join(outDir, `${name}-${phase}.png`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`saved ${path.basename(file)}`);
}

async function gotoSafe(page, urlPath) {
  await page.goto(`${baseURL}${urlPath}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.waitForTimeout(1400);
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
      console.log('no devCode');
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

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const loggedIn = await tryLogin(page);

  // Desktop marketing / catalog
  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoSafe(page, '/ru');
  await shot(page, 'landing-desktop-ru');
  await gotoSafe(page, '/kk');
  await shot(page, 'landing-desktop-kk');
  await gotoSafe(page, '/ru/templates');
  await shot(page, 'templates-desktop-ru');
  await gotoSafe(page, '/ru/pricing');
  await shot(page, 'pricing-desktop-ru');
  await gotoSafe(page, '/ru/login');
  await shot(page, 'login-desktop-ru');

  if (loggedIn) {
    await gotoSafe(page, '/ru/dashboard');
    await shot(page, 'dashboard-desktop-ru');
  }

  // Live editor desktop — dismiss guided for chrome shot
  await gotoSafe(page, '/ru/invitations/edit?template=wedding-luxury');
  await page.evaluate(() => {
    try {
      window.sessionStorage.setItem('shaqyru.live-editor.guided-v1', '1');
    } catch {
      /* ignore */
    }
  });
  await gotoSafe(page, '/ru/invitations/edit?template=wedding-luxury');
  await page.waitForSelector('.live-editor-shell', { timeout: 90_000 }).catch(() => null);
  const guidedClose = page.locator('[data-testid="live-editor-guided"] button').filter({ hasText: /редактор|жабу|закрыть|пропуст/i }).first();
  if (await guidedClose.isVisible().catch(() => false)) {
    await guidedClose.click().catch(() => null);
  } else {
    await page.keyboard.press('Escape').catch(() => null);
  }
  await page.waitForTimeout(1500);
  await shot(page, 'editor-desktop-ru');

  // Guided overlay (step 1) — separate
  await page.evaluate(() => {
    try {
      window.sessionStorage.removeItem('shaqyru.live-editor.guided-v1');
    } catch {
      /* ignore */
    }
  });
  await gotoSafe(page, '/ru/invitations/edit?template=wedding-luxury&fresh=1');
  await page.waitForTimeout(1200);
  await shot(page, 'editor-guided-desktop-ru');

  // Quick wizard desktop
  await gotoSafe(page, '/ru/invitations/quick?template=wedding-luxury');
  await page.waitForTimeout(1500);
  await shot(page, 'quick-wizard-desktop-ru');

  // Templates preview modal — open first card preview button
  await gotoSafe(page, '/ru/templates');
  const previewOutline = page.getByRole('button', { name: /превью|қарау|смотреть/i }).first();
  if (await previewOutline.isVisible().catch(() => false)) {
    await previewOutline.click();
    await page.waitForTimeout(1400);
    await shot(page, 'templates-modal-desktop-ru');
    await page.keyboard.press('Escape').catch(() => null);
  }

  // Mobile 390
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoSafe(page, '/ru');
  await shot(page, 'landing-mobile-ru');
  await gotoSafe(page, '/ru/templates');
  await shot(page, 'templates-mobile-ru');
  await gotoSafe(page, '/ru/pricing');
  await shot(page, 'pricing-mobile-ru');

  if (loggedIn) {
    await gotoSafe(page, '/ru/dashboard');
    await shot(page, 'dashboard-mobile-ru');
  }

  await page.evaluate(() => {
    try {
      window.sessionStorage.setItem('shaqyru.live-editor.guided-v1', '1');
    } catch {
      /* ignore */
    }
  });
  await gotoSafe(page, '/ru/invitations/edit?template=wedding-luxury');
  await page.waitForSelector('.live-editor-shell', { timeout: 90_000 }).catch(() => null);
  await page.waitForTimeout(2000);
  await shot(page, 'editor-mobile-ru');

  await gotoSafe(page, '/ru/invitations/quick?template=wedding-luxury');
  await page.waitForTimeout(1500);
  await shot(page, 'quick-wizard-mobile-ru');

  await browser.close();
  console.log(`done phase=${phase}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
