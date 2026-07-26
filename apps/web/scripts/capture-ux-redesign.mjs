import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(process.cwd(), 'docs', 'visual-audit', '2026-07-21-ux-redesign');
const BASE = process.env.BASE_URL ?? 'http://localhost:3001';

const ROUTES = [
  { name: 'landing', url: '/', wait: '[data-testid="pricing-teaser"]' },
  { name: 'templates', url: '/templates', wait: '[data-testid="templates-search-input"]' },
  { name: 'pricing', url: '/pricing', wait: '[data-testid="pricing-page-content"]' },
  { name: 'login', url: '/login', wait: 'h1' },
];

const VIEWPORTS = [
  { label: 'mobile', width: 390, height: 844 },
  { label: 'desktop', width: 1440, height: 900 },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext();
await context.addCookies([
  { name: 'locale', value: 'ru', domain: '127.0.0.1', path: '/' },
  { name: 'locale', value: 'ru', domain: 'localhost', path: '/' },
]);

for (const viewport of VIEWPORTS) {
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route.url}`, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForSelector(route.wait, { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(OUT, `${route.name}-${viewport.label}-ru-after.png`),
      fullPage: true,
      animations: 'disabled',
    });
    console.log(`saved ${route.name}-${viewport.label}-ru-after.png`);
  }

  await page.close();
}

await browser.close();
