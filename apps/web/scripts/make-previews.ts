/**
 * Render catalogue preview images from the real templates.
 *
 * The preview a customer picks from must be the template itself, not a
 * hand-made mockup that can drift away from it. This spins up a throwaway
 * published invitation per template, screenshots its opening screen, and
 * writes the crop the catalogue card uses — then deletes the invitation.
 *
 *   pnpm previews
 */
import { PrismaClient } from '@prisma/client';
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();
const OUT_DIR = join(process.cwd(), 'public', 'assets', 'previews');
const BASE = process.env.PREVIEW_BASE_URL ?? 'http://localhost:3000';
const PREVIEW_EMAIL = 'preview-bot@qazshaqyru.internal';

async function main() {
  const templates = await prisma.template.findMany({
    where: { isActive: true, isCanvasTemplate: true },
    select: { slug: true, canvas: true },
  });
  if (templates.length === 0) {
    console.log('no active canvas templates');
    return;
  }

  let bot = await prisma.user.findFirst({ where: { email: PREVIEW_EMAIL } });
  if (!bot) bot = await prisma.user.create({ data: { email: PREVIEW_EMAIL, name: 'Preview bot' } });

  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    /*
     * One template failing must not cost every other template its preview.
     *
     * The loop used to let a throw escape into `main()`, so a single timeout
     * ended the whole run: the templates after it in sort order were never
     * attempted, and the only signal was a stack trace that looked like one
     * broken template rather than a catalogue with no cards. Failures are
     * collected per template and reported at the end with a non-zero exit.
     */
    const failed: string[] = [];

    for (const t of templates) {
      if (!t.canvas) continue;
      const slug = `preview-${t.slug}`;
      try {
        await prisma.invitation.deleteMany({ where: { slug } });
        await prisma.invitation.create({
          data: {
            userId: bot.id,
            title: `Preview ${t.slug}`,
            slug,
            eventType: 'wedding',
            eventDate: new Date('2027-05-15T12:00:00.000Z'),
            eventTimezone: 'Asia/Almaty',
            templateKey: t.slug,
            status: 'published',
            canvas: t.canvas as object,
          },
        });

        const page = await browser.newPage({
          viewport: { width: 390, height: 620 },
          deviceScaleFactor: 2,
        });
        await page.goto(`${BASE}/i/${slug}`, { waitUntil: 'networkidle', timeout: 60_000 });

        /*
         * Open the envelope first.
         *
         * A template with `envelopeEnabled` renders a sealed cover and nothing
         * else until the guest taps it, so `[data-canvas-width]` never appears
         * and this script timed out. It did that silently for weeks: the throw
         * escaped the loop, `main()` died on the first such template, and every
         * template after it in sort order was left without a preview too. That is
         * why the catalogue shipped three broken cards — `inju` and `xat` have
         * envelopes, and `syrmaq` simply came after them in the queue.
         */
        await page.waitForTimeout(3_000);
        const gate = page.locator('button', { hasText: /ашу|Открыть/ }).first();
        let gated = false;
        try {
          await gate.waitFor({ state: 'visible', timeout: 8_000 });
          gated = true;
        } catch {
          // No envelope on this template — the canvas is already on screen.
        }
        if (gated) {
          await gate.click({ force: true });
          await page.waitForTimeout(3_000);
        }

        await page.waitForSelector('[data-canvas-width]', { timeout: 20_000 });
        await page.evaluate(() => document.fonts.ready);
        // Entrance animations start at opacity 0; nudge the page so the opening
        // screen's observers fire, then return to the top.
        await page.evaluate(async () => {
          window.scrollTo(0, 200);
          await new Promise((r) => setTimeout(r, 400));
          window.scrollTo(0, 0);
          await new Promise((r) => setTimeout(r, 400));
        });
        // Then force every entrance to its end state.
        //
        // Waiting a fixed 1.2s was enough while every element shared one 760ms
        // fade; a template that choreographs its opening — ornament strokes that
        // draw for two seconds, names that arrive letter by letter — was being
        // photographed halfway through, and the catalogue card showed a
        // half-drawn rule under the couple's names.
        await page.addStyleTag({
          content:
            '.canvas-anim, .canvas-anim .canvas-letter { opacity: 1 !important; ' +
            'transform: none !important; animation: none !important; clip-path: none !important; }' +
            '.canvas-anim [data-draw] { stroke-dashoffset: 0 !important; animation: none !important; }',
        });
        await page.waitForTimeout(400);

        // Hide the app's own floating chrome — it is not part of the template.
        await page.evaluate(() => {
          document.querySelectorAll('body *').forEach((el) => {
            if (getComputedStyle(el).position === 'fixed') (el as HTMLElement).style.display = 'none';
          });
        });

        const shot = await page.screenshot({ fullPage: false });
        await page.close();

        const webp = await sharp(shot).resize({ width: 780 }).webp({ quality: 86 }).toBuffer();
        writeFileSync(join(OUT_DIR, `${t.slug}.webp`), webp);
        console.log(`${t.slug.padEnd(10)} ${(webp.length / 1024).toFixed(0)} KB`);

        await prisma.invitation.deleteMany({ where: { slug } });
      } catch (e) {
        failed.push(t.slug);
        console.error(`${t.slug.padEnd(10)} FAILED — ${String(e).split('\n')[0].slice(0, 120)}`);
        await prisma.invitation.deleteMany({ where: { slug } }).catch(() => {});
      }
    }

    if (failed.length) {
      console.error(`\n${failed.length} preview(s) not generated: ${failed.join(', ')}`);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await prisma.invitation.deleteMany({ where: { userId: bot.id } });
    await prisma.user.delete({ where: { id: bot.id } }).catch(() => {});
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
