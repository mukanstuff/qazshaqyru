import { chromium } from '@playwright/test';
import fs from 'fs';

const outDir = 'c:/shaqyru/apps/web/docs/visual-audit/2026-07-16';
const url = 'http://localhost:3000/invitations/edit?template=wedding-luxury';

fs.mkdirSync(outDir, { recursive: true });

async function measure(page, label) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('[data-testid="live-editor-preview"]', { timeout: 60000 });
  await page.waitForTimeout(800);

  const metrics = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const shell = document.querySelector('.live-editor-shell');
    const topbar = document.querySelector('.live-editor-topbar');
    const stageWrap = document.querySelector('.live-editor-stage-wrap');
    const stage = document.querySelector('.live-editor-stage');
    const phone = document.querySelector('.live-editor-phone');
    const frame = document.querySelector('.live-editor-phone__frame');
    const viewport = document.querySelector('.live-editor-phone__viewport');
    const content = document.querySelector('.live-editor-phone__content');
    const guest = document.querySelector('.guest-page--editor-frame');
    const rail = document.querySelector('.live-editor-phone__scroll-rail');
    const floatingRail = document.querySelector('.live-editor-rail');

    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        height: cs.height,
        maxHeight: cs.maxHeight,
        minHeight: cs.minHeight,
        position: cs.position,
        scrollH: el.scrollHeight,
        clientH: el.clientHeight,
        scrollW: el.scrollWidth,
        clientW: el.clientWidth,
      };
    };

    return {
      viewport: { innerW: window.innerWidth, innerH: window.innerHeight },
      doc: {
        scrollW: docEl.scrollWidth,
        clientW: docEl.clientWidth,
        scrollH: docEl.scrollHeight,
        clientH: docEl.clientHeight,
        hasHScroll: docEl.scrollWidth > docEl.clientWidth + 1,
        hasVScroll: docEl.scrollHeight > docEl.clientHeight + 1,
      },
      body: box(body),
      shell: box(shell),
      topbar: box(topbar),
      stageWrap: box(stageWrap),
      stage: box(stage),
      phone: box(phone),
      frame: box(frame),
      viewportEl: box(viewport),
      content: box(content),
      guest: box(guest),
      rail: box(rail),
      floatingRail: box(floatingRail),
      centerDelta: frame
        ? Math.round(
            frame.getBoundingClientRect().left +
              frame.getBoundingClientRect().width / 2 -
              window.innerWidth / 2,
          )
        : null,
      phoneCenterDelta: phone
        ? Math.round(
            phone.getBoundingClientRect().left +
              phone.getBoundingClientRect().width / 2 -
              window.innerWidth / 2,
          )
        : null,
    };
  });

  const before = await page.evaluate(() => ({
    docY: window.scrollY,
    vpY: document.querySelector('.live-editor-phone__viewport')?.scrollTop ?? null,
    guestY: document.querySelector('.guest-page--editor-frame')?.scrollTop ?? null,
  }));

  const frameBox = await page.locator('.live-editor-phone__frame').boundingBox();
  if (frameBox) {
    await page.mouse.move(frameBox.x + frameBox.width / 2, frameBox.y + frameBox.height / 2);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
  }

  const after = await page.evaluate(() => ({
    docY: window.scrollY,
    vpY: document.querySelector('.live-editor-phone__viewport')?.scrollTop ?? null,
    guestY: document.querySelector('.guest-page--editor-frame')?.scrollTop ?? null,
  }));

  await page.screenshot({ path: `${outDir}/editor-broken-${label}.png`, fullPage: false });

  return { label, metrics, scrollTest: { before, after } };
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (const [w, h, label] of [
  [1440, 900, 'd1440'],
  [1280, 800, 'd1280'],
  [390, 844, 'm390'],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  results.push(await measure(page, label));
  await page.close();
}
await browser.close();
fs.writeFileSync(`${outDir}/editor-layout-metrics.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
