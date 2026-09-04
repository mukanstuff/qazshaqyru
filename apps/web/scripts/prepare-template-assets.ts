/**
 * Turn hand-generated artwork into assets the canvas can actually ship.
 *
 *   npx tsx scripts/prepare-template-assets.ts ak-otau
 *
 * Two jobs, both of which were being done by eye before and neither of which
 * an image model can do for you:
 *
 * 1. Photographs arrive as whatever the generator produced — in practice JPEG
 *    bytes carrying a `.webp` name, around 800KB each. Nine of those is 6MB of
 *    invitation on a phone, which in this market is the difference between the
 *    page opening and the guest closing it. They are re-encoded to real WebP.
 *
 * 2. Ornaments arrive as black line art on white, because that is the only
 *    thing an image model draws reliably — asking for a transparent PNG gets
 *    you a white rectangle with "transparent" written on it. The white has to
 *    be keyed to alpha here so `ImageElement.tint` can paint the silhouette in
 *    the theme's colour. Alpha comes from inverted luminance and the RGB is
 *    forced to black, so the file carries shape only and never a colour of its
 *    own.
 *
 * Re-running is safe and idempotent: sources live in `_src/`, outputs are
 * rewritten from them every time.
 */
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'fs';
import { join, parse } from 'path';
import sharp from 'sharp';

/** Which files are ornament masks rather than photographs. */
const ORNAMENT = /^oyu-/;

/** Long edge per asset role. Photographs never need more than this on a
 *  390px-wide canvas at 3x, and ornaments are line art that stays crisp. */
const MAX_EDGE: Array<[RegExp, number]> = [
  [/^hero|^closing/, 1600],
  [/^story/, 1200],
  [/^paper/, 1200],
];

function maxEdgeFor(name: string): number {
  for (const [re, px] of MAX_EDGE) if (re.test(name)) return px;
  return 1400;
}

/**
 * Key white to transparent, keeping only the silhouette.
 *
 * Headroom at both ends matters: these come out of a lossy encoder, so
 * "white" is really 245-255 and "black" is 0-12. Mapping the full 0-255 range
 * linearly leaves a grey haze across what should be empty paper.
 */
async function toAlphaMask(input: string, out: string, width: number): Promise<void> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const alpha = Math.max(0, Math.min(255, Math.round(((245 - luma) / 210) * 255)));
    px[o] = 0;
    px[o + 1] = 0;
    px[o + 2] = 0;
    px[o + 3] = alpha;
  }

  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    // Trim the empty paper the model always leaves around the drawing, so the
    // element's box is the ornament and positioning means what it says.
    .trim({ threshold: 6 })
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(out);
}

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error('usage: prepare-template-assets.ts <templateSlug>');

  const dir = join(process.cwd(), 'public', 'assets', 'templates', slug);
  if (!existsSync(dir)) throw new Error(`no such asset directory: ${dir}`);

  // Originals are moved aside once and kept: re-encoding an already-encoded
  // output on the next run would compound the loss.
  const src = join(dir, '_src');
  mkdirSync(src, { recursive: true });

  for (const file of readdirSync(dir)) {
    const full = join(dir, file);
    if (statSync(full).isDirectory()) continue;
    if (!existsSync(join(src, file))) renameSync(full, join(src, file));
  }

  for (const file of readdirSync(src)) {
    const { name } = parse(file);
    const input = join(src, file);
    const before = Math.round(statSync(input).size / 1024);

    if (ORNAMENT.test(name)) {
      const out = join(dir, `${name}.png`);
      await toAlphaMask(input, out, 1400);
      const after = Math.round(statSync(out).size / 1024);
      console.log(`${name.padEnd(16)} mask  ${before}KB -> ${after}KB`);
      continue;
    }

    const out = join(dir, `${name}.webp`);
    const edge = maxEdgeFor(name);
    const pipeline = sharp(input)
      .rotate()
      .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true });

    /*
     * The page ground is blurred on purpose.
     *
     * It is stretched with `background-size: cover` over a document five
     * thousand pixels tall — a six-fold upscale of a lossy file — so every
     * 8x8 compression block in the source becomes a visible rectangular patch
     * behind the text. That is exactly what shipped: faint blotches drifting
     * across the ivory sections. Blurring first leaves the tonal variation
     * that makes the ground feel like paper and removes the structure that
     * the upscale would otherwise magnify into artefacts.
     */
    if (/^paper|^ground|^texture/.test(name)) pipeline.blur(18);

    await pipeline.webp({ quality: 82 }).toFile(out);
    const after = Math.round(statSync(out).size / 1024);
    console.log(`${name.padEnd(16)} photo ${before}KB -> ${after}KB`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
