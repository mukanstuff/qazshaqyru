/**
 * Screenshot one viewport of a published invitation at a given scroll offset.
 *
 *   node scripts/shot-viewport.mjs http://localhost:3000/i/preview-saukele 1400 out.png
 *
 * `shot-gate.mjs` captures the whole page, which is the wrong instrument for
 * anything pinned to the viewport: a fixed element lands wherever the capture
 * happened to leave it, and a floating control cannot be reviewed that way at
 * all. This opens the envelope, scrolls to the offset, and shoots 390x844.
 */
import { chromium } from '@playwright/test';

const [url, offsetArg, out] = process.argv.slice(2);
const offset = Number(offsetArg) || 0;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

const btn = page.locator('button', { hasText: /ашу|Открыть/ }).first();
try {
  await btn.waitFor({ state: 'visible', timeout: 8000 });
  await btn.click({ force: true });
  // The filmed gate runs its clip before handing over.
  await page.waitForTimeout(6000);
} catch {
  /* no envelope on this document */
}

await page.evaluate(async (y) => {
  document.querySelectorAll('.canvas-anim').forEach((e) => e.classList.add('is-visible'));
  // A wheel event is what cancels auto-scroll; without it the page creeps
  // away from the offset while the shot is being taken.
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 1 }));
  window.scrollTo({ top: y, behavior: 'instant' });
  await new Promise((r) => setTimeout(r, 900));
}, offset);

await page.waitForTimeout(1200);
await page.screenshot({ path: out });
console.log('saved', out, 'at', await page.evaluate(() => Math.round(window.scrollY)));
await browser.close();
