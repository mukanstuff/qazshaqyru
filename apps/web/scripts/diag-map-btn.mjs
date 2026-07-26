import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/i/demo?layout=wedding-luxury');
await page.waitForResponse(
  (r) => r.url().includes('/api/invitations/public/demo') && r.status() === 200,
  { timeout: 25000 },
);
const open = page.getByRole('button', { name: /Открыть приглашение|Ашу/i });
if (await open.isVisible().catch(() => false)) await open.click();
await page.locator('[data-section="venue-map"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
const btn = page.locator('.inv-manifest-map-btn');
console.log('btn count', await btn.count());
if (await btn.count()) {
  console.log('text:', JSON.stringify(await btn.innerText()));
  console.log('styles:', JSON.stringify(await btn.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      color: s.color,
      bg: s.backgroundColor,
      fontSize: s.fontSize,
      fontFamily: s.fontFamily,
      opacity: s.opacity,
      w: el.offsetWidth,
      h: el.offsetHeight,
    };
  })));
  await page.screenshot({
    path: 'docs/visual-audit/2026-07-10/clip-venue-map-btn-m390-ru.png',
    clip: { x: 0, y: 400, width: 390, height: 300 },
  });
}
await browser.close();
