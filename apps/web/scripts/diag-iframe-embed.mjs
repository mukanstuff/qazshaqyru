import { chromium } from '@playwright/test';
import * as fs from 'fs';

const OUT = 'docs/visual-audit/2026-07-10';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const url of [
  '/i/demo?layout=wedding-luxury&embed=1',
  '/i/demo?layout=wedding-luxury',
]) {
  await page.goto(`http://127.0.0.1:3000${url}`);
  await page.waitForTimeout(5000);
  const text = await page.locator('body').innerText();
  const name = url.includes('embed=1') ? 'embed-direct' : 'demo-direct';
  console.log(name, 'body chars', text.length);
  await page.screenshot({ path: `${OUT}/diag-${name}-d1440.png`, fullPage: false });
}

await page.goto('http://127.0.0.1:3000/templates');
await page.getByTestId('templates-search-input').waitFor({ timeout: 15000 });
await page.getByRole('button', { name: /Превью/i }).first().click();
await page.waitForTimeout(5000);
const frame = page.frameLocator('iframe').first();
const frameText = await frame.locator('body').innerText().catch((e) => `ERR: ${e.message}`);
console.log('modal iframe chars', frameText.length || frameText);
await page.screenshot({ path: `${OUT}/diag-modal-iframe-d1440.png`, fullPage: false });

await browser.close();
