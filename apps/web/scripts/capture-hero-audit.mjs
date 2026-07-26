import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const out = 'docs/visual-audit/2026-07-18';
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForSelector('[data-testid=landing-hero-brand]');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/hero-desktop-ru.png` });

const desk = await page.evaluate(() => {
  const title = document.querySelector('[data-testid=landing-hero-title]');
  const sub = document.querySelector('[data-testid=landing-hero-subtitle]');
  const frame = document.querySelector('[data-testid=hero-product-frame]');
  const brand = document.querySelector('[data-testid=landing-hero-brand]');
  const css = (el) => (el ? getComputedStyle(el).color : null);
  return {
    brand: brand?.textContent,
    titleColor: css(title),
    subColor: css(sub),
    brandColor: css(brand),
    frameW: frame ? Math.round(frame.getBoundingClientRect().width) : 0,
    hasWish: document.body.innerText.includes('Бақытты'),
    hasPriceUnderCta: !!document.querySelector('[data-testid=landing-hero-ctas] + p'),
  };
});
console.log('DESK', JSON.stringify(desk));

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/hero-mobile-ru.png` });

const mob = await page.evaluate(() => {
  const frame = document.querySelector('[data-testid=hero-product-frame]');
  const r = frame?.getBoundingClientRect();
  return {
    frameW: r ? Math.round(r.width) : 0,
    frameTop: r ? Math.round(r.top) : null,
    inViewport: r ? r.top < window.innerHeight && r.bottom > 0 : false,
  };
});
console.log('MOB', JSON.stringify(mob));

const html = await page.content();
const cssHrefs = [...html.matchAll(/\/_next\/static\/css\/[^"']+/g)].map((m) => m[0]);
for (const href of cssHrefs.slice(0, 6)) {
  const res = await page.request.get(`http://localhost:3000${href}`);
  const body = await res.text();
  if (body.includes('landing-hero-on-dark')) {
    const i = body.indexOf('.landing-hero-on-dark');
    console.log('CSS_OK', href);
    console.log('SNIP', body.slice(i, i + 220).replace(/\s+/g, ' '));
  }
}

await browser.close();
