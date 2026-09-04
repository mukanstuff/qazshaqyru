/**
 * Render a page to a PNG so a design can actually be looked at.
 *
 * This exists because template work has no useful feedback loop otherwise:
 * a canvas document can pass every schema check and every unit test and still
 * be ugly, mistimed, or have its text sitting under a floating button. Unit
 * tests answer "is it valid"; this answers "how does it look".
 *
 * Renders at deviceScaleFactor 2 so text is legible when the PNG is read back.
 *
 *   pnpm shot http://localhost:3000/i/some-slug out.png
 *   pnpm shot http://localhost:3000/i/some-slug out.png 390 --viewport
 *
 * Args: <url> [outPath] [width] [--viewport]
 *   width      design width in CSS px (default 390, the mobile canvas width)
 *   --viewport capture only the first screen instead of the full page —
 *              useful for checking the hero, which is what a guest sees first
 */
import { chromium } from '@playwright/test';

async function main() {
  const args = process.argv.slice(2);
  const viewportOnly = args.includes('--viewport');
  const positional = args.filter((a) => !a.startsWith('--'));

  const url = positional[0];
  if (!url) {
    console.error('usage: pnpm shot <url> [outPath] [width] [--viewport]');
    process.exit(1);
  }
  const out = positional[1] ?? 'shot.png';
  const width = Number(positional[2] ?? 390);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width, height: 844 },
      deviceScaleFactor: 2,
    });

    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });

    // The guest page fetches its canvas after hydration, so `networkidle`
    // alone captures the loading skeleton. Wait for the stage to exist.
    await page
      .waitForSelector('[data-canvas-width]', { timeout: 20_000 })
      .catch(() => console.warn('note: no canvas stage found — not an invitation page?'));

    // Webfonts decide final line breaks and element heights; screenshotting
    // before they settle produces a layout that never actually ships.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);

    // Entrance animations start elements at opacity 0 and reveal them through
    // an IntersectionObserver, so a fullPage capture taken without scrolling
    // photographs an almost empty page. Walk the document to fire every
    // observer, then return to the top before shooting.
    if (!viewportOnly) {
      await page.evaluate(async () => {
        const step = window.innerHeight * 0.6;
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 260));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 400));
      });

      /*
       * Wait for the entrance animations to actually finish.
       *
       * A fixed pause is not good enough and produced genuinely misleading
       * screenshots: entrances carry per-element delays of up to ~0.9s on top
       * of a ~1s duration, so a capture taken too early photographs a page
       * with whole sections still at opacity 0 — which reads exactly like a
       * rendering bug and sent this session chasing one that did not exist.
       *
       * Looping `idle` animations never finish by definition, so they are
       * excluded; only the one-shot entrances are waited on.
       */
      await page
        .waitForFunction(
          () =>
            document
              .getAnimations()
              .filter((a) => {
                const name = (a as CSSAnimation).animationName ?? '';
                return name.startsWith('canvas-') && !name.startsWith('canvas-idle-');
              })
              .every((a) => a.playState === 'finished'),
          undefined,
          { timeout: 15_000 },
        )
        .catch(() => console.warn('note: some entrance animations never finished'));
      await page.waitForTimeout(400);
    }

    await page.screenshot({ path: out, fullPage: !viewportOnly });

    const size = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
    }));

    console.log(`saved ${out}  (${size.height}px tall)`);
    if (size.scrollWidth > size.clientWidth) {
      console.warn(
        `WARNING: page scrolls horizontally (${size.scrollWidth} > ${size.clientWidth}) — ` +
          'an element is bleeding without being cropped.'
      );
    }
    if (errors.length) {
      console.warn(`page errors:\n  ${errors.slice(0, 5).join('\n  ')}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
