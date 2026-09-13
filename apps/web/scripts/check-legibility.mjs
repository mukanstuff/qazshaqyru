/**
 * Is the type on the photographs actually readable?
 *
 *   node scripts/check-legibility.mjs http://localhost:3000/i/preview-saukele
 *   node scripts/check-legibility.mjs <url> --min=4.5 --shots=out/
 *
 * The numeric gate (`self-check-template.ts`) counts how many text blocks sit
 * on photography, because the reference set leans on that device — but it
 * reads the document out of the database and therefore cannot see the one
 * thing that matters about it. «Сәукеле» passed 31 checks out of 31 with a
 * hero whose three lines the owner could not read.
 *
 * What this measures, per text block that overlaps an image or a clip:
 *
 *   glyph      median luminance of the darkest pixels in the block (the ink)
 *   ground     median luminance of everything that is not ink
 *   worst      FIFTH PERCENTILE of the ground — the dark folds, the ribbon,
 *              the hair that pass behind the letters
 *   ratio      WCAG contrast of the ink against that worst ground
 *
 * The last column is the number that matters and the one an average gets
 * wrong: on the hero this script was written for, mean contrast read 10.9:1
 * while the worst case was 6.6:1 and the line was genuinely hard to read.
 *
 * Thresholds: 4.5:1 is the WCAG minimum for body text, and everything here is
 * display type over artwork, so treat 4.5 as the floor and 7 as the target.
 * Below 4.5 the answer is usually not a stronger shadow — it is to move the
 * block to a quiet part of the frame. `measure-frame.mjs` finds one.
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--'));
const min = Number((args.find((a) => a.startsWith('--min=')) || '').split('=')[1] || 4.5);
const shotDir = (args.find((a) => a.startsWith('--shots=')) || '').split('=')[1] || '';

if (!url) {
  console.error('usage: node scripts/check-legibility.mjs <published invitation url> [--min=4.5] [--shots=dir]');
  process.exit(2);
}
if (shotDir && !existsSync(shotDir)) mkdirSync(shotDir, { recursive: true });

const srgbToLinear = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const luminance = (r, g, b) =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);

// The envelope, if this template opens behind one.
const gate = page.locator('button', { hasText: /ашу|Открыть/ }).first();
try {
  await gate.waitFor({ state: 'visible', timeout: 8000 });
  await gate.click({ force: true });
  await page.waitForTimeout(6000);
} catch {
  /* no gate */
}

// Entrances held at opacity 0 would measure as blank paper.
await page.evaluate(async () => {
  document.querySelectorAll('.canvas-anim').forEach((e) => e.classList.add('is-visible', 'is-settled'));
  window.dispatchEvent(new WheelEvent('wheel', { deltaY: 1 }));
  await new Promise((r) => setTimeout(r, 400));
});

/**
 * Text over artwork, as the page actually lays it out.
 *
 * Overlap is decided on rendered rectangles rather than on the document,
 * because that is what the reader sees: an element's own box can sit beside a
 * photograph while its wrapped text runs across it.
 */
const canvasFound = await page.evaluate(() => document.querySelectorAll('img, video').length > 0 && document.body.innerText.length > 120);
if (!canvasFound) {
  console.error('\nthis page has no invitation on it — check the slug is still published\n');
  await browser.close();
  process.exit(2);
}

const blocks = await page.evaluate(() => {
  const art = [...document.querySelectorAll('img, video')]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter((o) => o.r.width > 80 && o.r.height > 80);

  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const seen = new Set();
  while (walker.nextNode()) {
    const el = walker.currentNode;
    /*
     * A name animated letter by letter is one block, not eleven.
     *
     * The `letters` entrance wraps every character in its own span, so a leaf
     * walk finds eleven one-character elements and the length filter throws
     * all of them away — which is how the largest word on the page was the one
     * thing this check did not measure.
     */
    const kids = [...el.children];
    const isLetterSplit =
      kids.length > 1 && kids.every((k) => k.children.length === 0 && (k.textContent || '').trim().length <= 2);
    if (el.children.length > 0 && !isLetterSplit) continue;
    const text = (el.textContent || '').trim();
    if (text.length < 2) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 8) continue;
    const over = art.find(
      (a) =>
        a.r.left < r.right && a.r.right > r.left && a.r.top < r.bottom && a.r.bottom > r.top,
    );
    if (!over) continue;
    const key = `${Math.round(r.top)}:${text.slice(0, 12)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const cs = getComputedStyle(el);
    out.push({
      text: text.slice(0, 28),
      color: cs.color,
      fontSize: Math.round(parseFloat(cs.fontSize)),
      shadow: cs.textShadow === 'none' ? '' : cs.textShadow,
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
      behind: (over.el.currentSrc || over.el.src || '').split('/').pop(),
    });
  }
  return out;
});

const rows = [];
for (const b of blocks) {
  // A margin around the block so the ground is sampled next to the letters
  // rather than only between them.
  const pad = Math.max(6, Math.round(b.fontSize * 0.4));
  const clip = {
    x: Math.max(0, b.x - pad),
    y: Math.max(0, b.y - pad),
    width: b.w + pad * 2,
    height: b.h + pad * 2,
  };
  // fullPage, because a clip is otherwise cut against the viewport and every
  // block below the fold throws "clipped area is outside the image".
  const buf = await page.screenshot({ clip, fullPage: true, animations: 'disabled' });
  if (shotDir) writeFileSync(join(shotDir, `${b.y}-${b.text.slice(0, 10).replace(/\W+/g, '_')}.png`), buf);

  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const lums = [];
  for (let i = 0; i < data.length; i += info.channels) {
    lums.push(luminance(data[i], data[i + 1], data[i + 2]));
  }
  lums.sort((a, b2) => a - b2);
  const median = lums[Math.floor(lums.length * 0.5)];

  /*
   * Ink is found by colour, not by percentile.
   *
   * A percentile cannot work here: letterspaced 18px covers about one per cent
   * of its own box, so "the darkest six per cent" is mostly antialiasing and
   * the block scores 2:1 when it is really 12:1. The document knows what
   * colour the type is — take the pixels that are actually that colour, and
   * call everything a clear step away from it the ground.
   */
  const m = /rgba?\((\d+), ?(\d+), ?(\d+)/.exec(b.color);
  const inkLum = m ? luminance(+m[1], +m[2], +m[3]) : 0;
  const darkOnLight = inkLum < median;

  const ink = lums.filter((v) => Math.abs(v - inkLum) < 0.08);
  const ground = lums.filter((v) => (darkOnLight ? v > inkLum + 0.3 : v < inkLum - 0.3));
  if (ink.length < 40 || ground.length < 40) continue;

  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const inkMed = mean(ink);
  const groundMed = ground[Math.floor(ground.length * 0.5)];
  // The worst of the ground is the point of the whole exercise.
  const worst = darkOnLight
    ? ground[Math.floor(ground.length * 0.05)]
    : ground[Math.floor(ground.length * 0.95)];

  rows.push({
    text: b.text,
    size: b.fontSize,
    glow: b.shadow ? 'yes' : '—',
    behind: b.behind,
    typical: +contrast(inkMed, groundMed).toFixed(1),
    worst: +contrast(inkMed, worst).toFixed(1),
  });
}

await browser.close();

if (rows.length === 0) {
  console.log('\nno text sits on artwork in this document\n');
  process.exit(0);
}

console.log(`\n${url}\n`);
console.log('  text                          size  glow   typical   worst   behind');
let failed = 0;
for (const r of rows.sort((a, b) => a.worst - b.worst)) {
  const ok = r.worst >= min;
  if (!ok) failed += 1;
  console.log(
    `  ${ok ? 'OK  ' : 'FAIL'} ${r.text.padEnd(26)} ${String(r.size).padStart(3)}  ${r.glow.padEnd(4)} ` +
      `${String(r.typical).padStart(7)}:1 ${String(r.worst).padStart(6)}:1   ${r.behind}`,
  );
}
console.log(
  `\n${failed ? `FAIL — ${failed} of ${rows.length} below ${min}:1 against the worst of the ground behind them` : `PASS — ${rows.length} block(s), all at or above ${min}:1`}\n`,
);
process.exit(failed ? 1 : 0);
