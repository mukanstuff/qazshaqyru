import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3002';
const outDir = path.join(process.cwd(), 'docs/visual-audit/2026-07-14');

const viewports = [
  { name: 'desktop-ru', width: 1280, height: 800 },
  { name: 'mobile-ru', width: 390, height: 844 },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(`${baseURL}/invitations/quick?template=wedding-luxury`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.getByTestId('quick-edit').waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(outDir, `quick-edit-${vp.name}-before.png`),
    fullPage: true,
  });
}

await browser.close();
console.log(`Saved screenshots to ${outDir}`);
