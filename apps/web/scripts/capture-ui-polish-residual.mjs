import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseURL = 'http://127.0.0.1:3000';
const outDir = path.join(process.cwd(), 'docs/visual-audit/2026-07-21-ui-polish');

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.waitForTimeout(700);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', path.basename(file));
}

async function gotoSafe(page, urlPath) {
  await page.goto(`${baseURL}${urlPath}`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForTimeout(1600);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1280, height: 800 });
  await gotoSafe(page, '/ru/templates');
  const previewBtn = page.getByRole('button', { name: /превью/i }).first();
  if (await previewBtn.isVisible().catch(() => false)) {
    await previewBtn.click();
    await page.waitForTimeout(1600);
    await shot(page, 'templates-modal-desktop-ru-after');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoSafe(page, '/ru/templates');
  await shot(page, 'templates-mobile-ru-after');
  await gotoSafe(page, '/ru/pricing');
  await shot(page, 'pricing-mobile-ru-after');

  await page.evaluate(() => {
    try {
      window.sessionStorage.setItem('shaqyru.live-editor.guided-v1', '1');
    } catch {
      /* ignore */
    }
  });
  await gotoSafe(page, '/ru/invitations/edit?template=wedding-luxury');
  await page.waitForSelector('.live-editor-shell', { timeout: 120_000 }).catch(() => null);
  await page.waitForTimeout(2000);
  await shot(page, 'editor-mobile-ru-after');

  await browser.close();
  console.log('done residual');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
