import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3003';
const outDir = path.join(process.cwd(), 'docs/visual-audit/2026-07-14');

async function capture() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.addInitScript(() => {
    window.localStorage.setItem('locale', 'ru');
  });

  const shots = [
    { name: 'quick-edit-mobile-ru', width: 390, height: 844 },
    { name: 'quick-edit-mobile-ru-full', width: 390, height: 844, fullPage: true },
    { name: 'quick-edit-desktop-ru', width: 1280, height: 900 },
  ];

  for (const shot of shots) {
    await page.setViewportSize({ width: shot.width, height: shot.height });
    await page.goto(`${baseURL}/invitations/quick?template=wedding-luxury`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForSelector('[data-testid="quick-edit"]', { timeout: 120_000 });
    await page.waitForSelector('[data-testid="quick-edit-preview"]', { timeout: 30_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(outDir, `${shot.name}.png`),
      fullPage: shot.fullPage ?? false,
    });
    console.log(`saved ${shot.name}.png`);
  }

  await browser.close();
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
