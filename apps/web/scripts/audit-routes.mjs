/**
 * Route auditor for the product-wide audit.
 *
 * Opens each route in a real 390x844 phone viewport, logged in when asked, and
 * reports the things that repeatedly turned out to be broken here: missing
 * `h1`, images that resolved to nothing, 4xx responses, console errors, and
 * Russian strings left in a Kazakh session.
 *
 * Written after categories 1-2 of the audit, where every one of those five was
 * found on a page that typechecked and passed its tests. See
 * docs/product-audit-playbook.md.
 *
 *   node scripts/audit-routes.mjs /templates /templates/wedding
 *   node scripts/audit-routes.mjs --locale=kz --login=+77015550142 /dashboard
 *   node scripts/audit-routes.mjs --shots=out/ --json=audit.json /templates
 *
 * The dev server must already be up (start it with the preview tool, not Bash).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.env.AUDIT_BASE ?? 'http://localhost:3000';
const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const routes = args
  .filter((a) => !a.startsWith('--'))
  .map((a) => (a.startsWith('/') ? a : '/' + a));
/* Git Bash rewrites a bare `/templates` into `C:/Program Files/…/templates`
   before node ever sees it. Say so instead of fetching a nonsense URL. */
const mangled = routes.find((r) => /^\/[A-Za-z]:[\\/]/.test(r));
if (mangled) {
  console.error(`route was rewritten by the shell: ${mangled}`);
  console.error('run from PowerShell, or prefix the command with MSYS_NO_PATHCONV=1');
  process.exit(1);
}
if (routes.length === 0) {
  console.error('usage: node scripts/audit-routes.mjs [--locale=ru|kz] [--login=+7…] [--password=…] [--shots=dir] [--json=file] <route> …');
  process.exit(1);
}
const locale = flag('locale', 'ru');
const loginPhone = flag('login');
const password = flag('password', 'Test12345');
const shotsDir = flag('shots');
const jsonOut = flag('json');

/* Cyrillic that only Russian uses, plus the handful of Russian words that show
   up in leftovers. Kazakh shares the alphabet, so a letter test alone is noise. */
const RU_ONLY = /(Загрузка|Открыть|Отмена|Оплатить|Создать|Приглашени|Шаблон[ыа]?\b|Гости\b|Ссылка|Выберите|Сохранить|Готово|Далее)/;

let sessionCookie = null;
if (loginPhone) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ phone: loginPhone, password }),
  });
  const raw = res.headers.getSetCookie().find((c) => c.startsWith('session_token='));
  if (!raw) {
    console.error(`login failed for ${loginPhone} (${res.status}) — register on /login first`);
    process.exit(1);
  }
  sessionCookie = raw.split(';')[0].split('=')[1];
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const cookies = [{ name: 'locale', value: locale, domain: 'localhost', path: '/' }];
if (sessionCookie) cookies.push({ name: 'session_token', value: sessionCookie, domain: 'localhost', path: '/' });
await ctx.addCookies(cookies);
const page = await ctx.newPage();

const consoleErrors = [];
const badRequests = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 140)));
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 140)));
page.on('response', (r) => r.status() >= 400 && badRequests.push(`${r.status()} ${r.url().replace(BASE, '').slice(0, 80)}`));

if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
const results = [];

for (const route of routes) {
  consoleErrors.length = 0;
  badRequests.length = 0;
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  /* First hit on a cold route can spend a minute compiling, and the skeleton
     has no h1 and no images — measuring it is how "every preview is broken"
     gets reported about a catalogue that is fine. */
  await page
    .waitForFunction(
      () => !/Загрузка|Жүктел/.test(document.body.innerText) && document.body.innerText.trim().length > 60,
      { timeout: 90_000 }
    )
    .catch(() => {});
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null)))));
  await page.waitForTimeout(1_500);

  const data = await page.evaluate((ruOnlySource) => {
    const ruOnly = new RegExp(ruOnlySource);
    const footer = document.querySelector('footer');
    const docHeight = document.documentElement.scrollHeight;
    return {
      status: document.title,
      h1: document.querySelector('h1')?.innerText.trim().slice(0, 80) ?? null,
      images: document.images.length,
      brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
      footerPct: footer && docHeight ? Math.round((footer.getBoundingClientRect().height / docHeight) * 100) : 0,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      ruLeftovers: [...document.querySelectorAll('h1,h2,h3,p,span,button,a,label')]
        .map((e) => (e.childElementCount === 0 ? (e.textContent || '').trim() : ''))
        .filter((s) => s && ruOnly.test(s))
        .slice(0, 6),
    };
  }, RU_ONLY.source);

  const rec = {
    route,
    locale,
    ...data,
    ruLeftovers: locale === 'kz' ? data.ruLeftovers : [],
    consoleErrors: [...new Set(consoleErrors)].slice(0, 4),
    badRequests: [...new Set(badRequests)].slice(0, 6),
  };
  results.push(rec);

  const problems = [
    rec.h1 ? null : 'no-h1',
    rec.brokenImages ? `broken-images=${rec.brokenImages}` : null,
    rec.badRequests.length ? `bad=${rec.badRequests.length}` : null,
    rec.consoleErrors.length ? `console=${rec.consoleErrors.length}` : null,
    rec.ruLeftovers.length ? `ru-in-kz=${rec.ruLeftovers.length}` : null,
    rec.horizontalOverflow ? 'h-overflow' : null,
    rec.footerPct >= 30 ? `footer=${rec.footerPct}%` : null,
  ].filter(Boolean);
  console.log(`${route.padEnd(38)} ${problems.length ? problems.join(' ') : 'ok'}`);

  if (shotsDir) {
    const name = (route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root') + '.png';
    await page.screenshot({ path: path.join(shotsDir, name), fullPage: true });
  }
}

if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(results, null, 1));
await browser.close();
process.exitCode = results.some((r) => !r.h1 || r.brokenImages || r.badRequests.length || r.consoleErrors.length || r.ruLeftovers.length) ? 1 : 0;
