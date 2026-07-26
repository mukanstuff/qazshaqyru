/**
 * Mobile QA audit — horizontal overflow, tap targets, sticky overlap hints.
 * Usage: node scripts/mobile-audit.mjs
 */
import { chromium } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { w: 320, h: 568, label: '320' },
  { w: 375, h: 812, label: '375' },
  { w: 390, h: 844, label: '390' },
  { w: 430, h: 932, label: '430' },
  { w: 768, h: 1024, label: '768' },
];

const ROUTES = [
  '/',
  '/templates',
  '/templates/wedding',
  '/blog',
  '/login',
  '/pricing',
  '/faq',
  '/about',
  '/contacts',
  '/terms',
  '/privacy',
  '/invitations/quick?template=wedding-luxury',
  '/invitations/edit?template=wedding-luxury',
  '/i/demo?layout=wedding-luxury',
  '/mock-payment',
  '/compare/done-for-you',
  '/wedding',
  '/dashboard',
  '/settings',
];

async function auditPage(page, route, vp) {
  const issues = [];
  try {
    const res = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    const status = res?.status() ?? 0;

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollW = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
      const clientW = doc.clientWidth;
      const overflow = scrollW - clientW;

      const smallTargets = [];
      for (const el of document.querySelectorAll('button, a, [role="button"], input, select, textarea')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        if (r.width < 40 || r.height < 40) {
          const label =
            el.getAttribute('aria-label') ||
            el.textContent?.trim().slice(0, 40) ||
            el.tagName;
          smallTargets.push({ label, w: Math.round(r.width), h: Math.round(r.height) });
        }
      }

      const clipped = [];
      for (const el of document.querySelectorAll('h1, h2, .landing-hero-brand, [data-testid]')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.left < -2 || r.right > window.innerWidth + 2) {
          clipped.push({
            tag: el.tagName,
            testId: el.getAttribute('data-testid'),
            left: Math.round(r.left),
            right: Math.round(r.right),
            vw: window.innerWidth,
          });
        }
      }

      return {
        scrollW,
        clientW,
        overflow,
        smallTargets: smallTargets.slice(0, 8),
        clipped: clipped.slice(0, 6),
        title: document.title,
      };
    });

    if (status >= 400) issues.push(`HTTP ${status}`);
    if (metrics.overflow > 2) issues.push(`horizontal overflow +${metrics.overflow}px (${metrics.scrollW}/${metrics.clientW})`);
    if (metrics.smallTargets.length) issues.push(`small tap targets: ${metrics.smallTargets.length}`);
    if (metrics.clipped.length) issues.push(`clipped elements: ${metrics.clipped.length}`);

    return { route, vp: vp.label, status, issues, metrics };
  } catch (err) {
    return { route, vp: vp.label, status: 0, issues: [err.message], metrics: null };
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE });
await ctx.addCookies([{ name: 'locale', value: 'ru', domain: '127.0.0.1', path: '/' }]);

const results = [];
for (const vp of VIEWPORTS) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: vp.w, height: vp.h });
  for (const route of ROUTES) {
    results.push(await auditPage(page, route, vp));
  }
  await page.close();
}

await browser.close();

const bad = results.filter((r) => r.issues.length);
console.log('\n=== MOBILE AUDIT SUMMARY ===');
console.log(`Checked: ${results.length} page×viewport combos`);
console.log(`Issues: ${bad.length}\n`);

for (const r of bad) {
  console.log(`[${r.vp}px] ${r.route}`);
  for (const i of r.issues) console.log(`  - ${i}`);
  if (r.metrics?.overflow > 2) {
    console.log(`    scroll ${r.metrics.scrollW} vs viewport ${r.metrics.clientW}`);
  }
  if (r.metrics?.clipped?.length) {
    for (const c of r.metrics.clipped) {
      console.log(`    clip: ${c.testId || c.tag} L${c.left} R${c.right} vw${c.vw}`);
    }
  }
  if (r.metrics?.smallTargets?.length) {
    for (const t of r.metrics.smallTargets.slice(0, 3)) {
      console.log(`    tap: "${t.label}" ${t.w}×${t.h}`);
    }
  }
}

process.exit(bad.length ? 1 : 0);
