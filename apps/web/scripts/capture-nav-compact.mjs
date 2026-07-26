import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const out = 'docs/visual-audit/2026-07-18';
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('[data-landing-nav][data-nav-over-hero]');
await page.waitForTimeout(1500);

await page.locator('[data-landing-nav]').first().screenshot({ path: `${out}/nav-pill-hero.png` });
await page.screenshot({ path: `${out}/landing-hero-top.png` });

// Force compact: scroll until data-nav-over-hero flips
for (let y = 400; y <= 2400; y += 200) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(200);
  const over = await page.getAttribute('[data-landing-nav][data-nav-over-hero]', 'data-nav-over-hero');
  if (over === 'false') break;
}

await page.waitForTimeout(600);
const state = await page.evaluate(() => {
  const root = document.querySelector('[data-nav-compact]');
  const pill = root?.querySelector(':scope > div.flex');
  const cta = [...(pill?.querySelectorAll('a') ?? [])].find((a) =>
    (a.textContent || '').includes('Создать'),
  );
  const how = [...(pill?.querySelectorAll('a') ?? [])].find((a) =>
    (a.textContent || '').includes('работает'),
  );
  const measure = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent || '').trim().replace(/\s+/g, ' '),
      whiteSpace: cs.whiteSpace,
      h: Math.round(r.height),
      w: Math.round(r.width),
      right: Math.round(r.right),
      clipped:
        pill && r.right > pill.getBoundingClientRect().right + 1
          ? true
          : pill && r.bottom > pill.getBoundingClientRect().bottom + 1,
    };
  };
  return {
    overHero: root?.getAttribute('data-nav-over-hero'),
    compact: root?.getAttribute('data-nav-compact'),
    width: root ? Math.round(root.getBoundingClientRect().width) : 0,
    pillH: pill ? Math.round(pill.getBoundingClientRect().height) : 0,
    pillRight: pill ? Math.round(pill.getBoundingClientRect().right) : 0,
    how: measure(how),
    cta: measure(cta),
  };
});
console.log(JSON.stringify(state, null, 2));

await page.locator('[data-landing-nav]').first().screenshot({ path: `${out}/nav-pill-compact.png` });
await page.screenshot({ path: `${out}/landing-scrolled.png` });
await browser.close();
