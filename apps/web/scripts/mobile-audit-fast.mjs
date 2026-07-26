/** Fast mobile audit — 390px, key routes only */
import { chromium } from '@playwright/test';
const BASE = 'http://127.0.0.1:3000';
const ROUTES = ['/', '/templates', '/invitations/edit?template=wedding-luxury', '/i/demo?layout=wedding-luxury', '/login', '/dashboard', '/settings', '/blog', '/pricing', '/faq', '/terms', '/mock-payment'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 } });
await ctx.addCookies([{ name: 'locale', value: 'ru', domain: '127.0.0.1', path: '/' }]);
const page = await ctx.newPage();
for (const route of ROUTES) {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => ({
    overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth,
    sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    cw: document.documentElement.clientWidth,
    title: document.title.slice(0, 50),
  }));
  const flag = m.overflow > 2 ? '❌' : '✓';
  console.log(`${flag} ${route} overflow=${m.overflow}px (${m.sw}/${m.cw})`);
}
await browser.close();
