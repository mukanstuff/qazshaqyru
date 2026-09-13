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

/**
 * Objects photographed against black, to be cut out and kept in colour.
 *
 * A torn paper edge and a wax seal are real photographs, and their whole
 * value is the colour and the light in them — a cream deckle against warm
 * paper, brown wax with a sheen. `ORNAMENT` is the wrong path for those: it
 * keys WHITE to alpha and then flattens the RGB to black so the silhouette
 * can be tinted. These need the opposite on both counts — key the BLACK
 * ground away and leave every pixel of the subject exactly as photographed.
 */
const CUTOUT = /^cut-/;

/** Mean luma a ground texture is toned to: the theme paper #F6F1E8 sits here,
 *  so a photographic ground lands on the same value and keeps its fibre. */
const GROUND_TARGET_MEAN = 236;

/** Luma standard deviation a repeating ground is flattened to. At 7 the
 *  repeat reads down a long page even with seamless joins; at 3 it does not. */
const GROUND_SIGMA = 3;

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
/**
 * Key a black backdrop to transparency, keeping the subject in full colour.
 *
 * Alpha comes from luminance directly (black = 0, bright = 255) with headroom
 * at both ends, because a JPEG "black" is really 0-18 and the subject's own
 * shadowed edge must not be eaten. The RGB is left untouched, so the cream of
 * the paper and the brown of the wax survive.
 *
 * Edge spill is the one thing to watch: a subject photographed on black keeps
 * a dark rim, which reads as a grey halo once the cutout lands on cream. The
 * alpha ramp starts at 18 rather than 0 so that rim falls below the floor
 * instead of becoming a semi-transparent outline.
 */
async function toBlackCutout(input: string, out: string, width: number): Promise<void> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    // Ramp from 10 to 36: everything darker than 10 is the backdrop, and any
    // subject pixel above 36 is fully opaque. The window is deliberately
    // narrow. A wider one looks gentler but makes dark subjects translucent —
    // brown wax reads at luma 50-90, so an earlier ramp that only saturated at
    // 80 rendered the seal as a stain with the paper grain showing through it.
    const raw = Math.max(0, Math.min(255, Math.round(((luma - 10) / 26) * 255)));
    px[o] = data[i];
    px[o + 1] = data[i + 1];
    px[o + 2] = data[i + 2];
    px[o + 3] = raw < 10 ? 0 : raw;
  }

  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 6 })
    .resize({ width, withoutEnlargement: true })
    // WebP, not PNG. These cutouts carry photographic colour, and PNG stores
    // that appallingly — the wax seal came out at 1.5MB and the torn edge at
    // 955KB, i.e. one decorative element heavier than every photograph in the
    // template combined. WebP keeps the alpha and lands about thirty times
    // smaller.
    .webp({ quality: 88, alphaQuality: 95 })
    .toFile(out);
}

/**
 * `tile`: the file repeats horizontally on the page (`tile: 'x'`), so its left
 * and right edges must stay exactly where the source was cut. The source is cut
 * to a whole number of pattern periods beforehand; the edge inset and the
 * transparent gutter below would each put a gap into every repeat. At the
 * scale «Тақия»'s band tiles at, the 2px gutter alone is 1.3 device pixels of
 * nothing through every stroke that crosses a seam.
 */
async function toAlphaMask(input: string, out: string, width: number, tile = false): Promise<void> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const raw = Math.max(0, Math.min(255, Math.round(((245 - luma) / 210) * 255)));
    // Floor the near-transparent tail to zero.
    //
    // JPEG "white" is not 255: the encoder leaves 238-252 with ringing along
    // every edge, so the paper around a drawing keeps an alpha of 3-12.
    //
    // To be clear about what this does and does not do: it was added on a
    // suspicion that the tail was showing as a faint block behind a tinted
    // ornament, and that suspicion was WRONG — sampling the rendered page
    // either side of the change gives #ede6d8 both times, so nothing visible
    // was fixed. It is kept because sub-5% alpha is still real cost for no
    // effect: it inflates the PNG (medallion 43KB -> 40KB, corner 16KB ->
    // 15KB) and it defeats `trim` below, which decides the ornament's own
    // bounding box and therefore what its coordinates mean.
    const alpha = raw < 13 ? 0 : raw;
    px[o] = 0;
    px[o + 1] = 0;
    px[o + 2] = 0;
    px[o + 3] = alpha;
  }

  /*
   * Cut the outermost half-percent before anything else.
   *
   * Image models frame a drawing: the medallion generated for «Інжу» came back
   * with a hairline box ruled around the whole canvas, one pixel in from the
   * edge. `trim` cannot remove it — it is ink, so trim keeps it — and once the
   * white is keyed to alpha that line becomes part of the silhouette. Tinted
   * and rotated on the page it read as a faint diamond around every ornament,
   * which took three wrong engine fixes before the asset itself was inspected.
   * Nothing a model draws that close to the edge is ever the artwork.
   */
  const inset = Math.max(4, Math.round(Math.min(info.width, info.height) * 0.006));
  const insetX = tile ? 0 : inset;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (x < insetX || y < inset || x >= info.width - insetX || y >= info.height - inset) {
        px[(y * info.width + x) * 4 + 3] = 0;
      }
    }
  }

  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    // Trim the empty paper the model always leaves around the drawing, so the
    // element's box is the ornament and positioning means what it says.
    .trim({ threshold: 6 })
    .resize({ width, withoutEnlargement: true })
    /*
     * Two fully transparent pixels back on every side.
     *
     * `trim` leaves the silhouette touching the file's own edge, and the
     * browser scales that file to `mask-size: contain`. Bilinear sampling at
     * the outermost texel then has nothing transparent to blend towards, so a
     * sliver of the tint colour smears along the element's box — a hairline
     * rectangle around every tinted ornament, and a visible diamond once the
     * ornament is rotated. A transparent margin gives the sampler somewhere
     * to fall to.
     */
    .extend({ top: 2, bottom: 2, left: tile ? 0 : 2, right: tile ? 0 : 2, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
}

/**
 * Clips and their posters are finished files, not sources.
 *
 * Videos are cut and encoded by hand with ffmpeg — the trim points and the CRF
 * are decisions per clip, see template-playbook.md — and a poster is a frame of
 * that encode. The adoption loop below used to take them as new sources: on
 * «Тақия» it moved hero.webm and envelope.webm into _src, re-encoded the
 * envelope poster from its own lossy output (49KB to 30KB), then threw
 * "unsupported image format" on the first clip and left every photograph after
 * it unprocessed.
 */
function isFinishedMedia(file: string): boolean {
  return /.(webm|mp4|mov|m4v)$/i.test(file) || /-poster.[a-z0-9]+$/i.test(file);
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

  // Adopt loose files as sources — but only genuinely new ones.
  //
  // The guard used to be `does _src already hold a file of this exact name`,
  // which is not the same question. Outputs are written under a different
  // extension (`pearls.jpg` in, `pearls.webp` out), so on the second run the
  // output failed that test, was moved into `_src` alongside its own source,
  // and was then re-encoded from an already-lossy file. Every re-run cost
  // another generation: pearls went 715KB -> 57KB -> 47KB across two runs,
  // losing detail each time, and the header comment above claimed this could
  // not happen. Compare BASENAMES instead, so an output never becomes a source.
  const known = new Set(readdirSync(src).map((f) => parse(f).name));

  for (const file of readdirSync(dir)) {
    const full = join(dir, file);
    if (statSync(full).isDirectory()) continue;
    if (isFinishedMedia(file)) continue;
    const { name } = parse(file);
    if (known.has(name)) continue;
    renameSync(full, join(src, file));
    known.add(name);
  }

  for (const file of readdirSync(src)) {
    if (isFinishedMedia(file)) continue;
    const { name } = parse(file);
    const input = join(src, file);
    const before = Math.round(statSync(input).size / 1024);

    if (CUTOUT.test(name)) {
      const out = join(dir, `${name}.webp`);
      await toBlackCutout(input, out, 1600);
      const after = Math.round(statSync(out).size / 1024);
      console.log(`${name.padEnd(16)} cutout ${before}KB -> ${after}KB`);
      continue;
    }

    if (ORNAMENT.test(name)) {
      const out = join(dir, `${name}.png`);
      await toAlphaMask(input, out, 1400, /-tile$/.test(name));
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

    // Ground textures need a higher quality than photographs. They are pure
    // fine grain with no edges to hide artefacts behind, and quality 82 turned
    // the paper into a 5KB blur — a smooth beige gradient where the whole point
    // was the fibre. They also tile behind every section, so a soft one is
    // visible on the entire page.
    const isGround = /^paper|^ground|^felt|^linen/.test(name);

    // Grounds are also re-toned, not just re-encoded.
    //
    // A generated "cream paper" photograph is never the cream the theme asks
    // for: this one came back at #DDCBB3 against a theme paper of #F6F1E7 —
    // two stops darker and far more saturated. Used full-bleed that is not a
    // subtle difference, it is the colour of the entire invitation, and every
    // piece of type on top of it loses contrast. Desaturating the yellow cast
    // and lifting the range brings it to #F1EDE5 while keeping the fibre,
    // which is the point of using a photograph rather than a flat fill.
    /*
     * The lift has to be measured, not fixed.
     *
     * `brightness: 1.14` plus `linear(1.06, 6)` was calibrated against one
     * source that arrived at #DDCBB3. A later paper came in already light, at
     * mean 226, and the same constants drove every pixel past 255: the output
     * was pure white, standard deviation zero, 2KB — the fibre the photograph
     * existed for was gone, and nothing in the log said so. Measure the source
     * and scale to the target instead, so a ground that is already close is
     * left almost alone and a dark one is still brought up.
     */
    let toned = pipeline;
    if (isGround) {
      const { channels } = await sharp(input).stats();
      const mean = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
      const lift = Math.min(1.35, Math.max(0.85, GROUND_TARGET_MEAN / mean));
      /*
       * Desaturate a warm cast, keep a cool ground's colour.
       *
       * 0.32 was calibrated on cream paper that came back yellow, and it is
       * right for that. «Тақия» asks for a powder-blue linen ground; at 0.32
       * the source's RGB 188,211,225 turns into a grey the palette never
       * chose, and the blue page the owner approved would not exist.
       */
      const cool = channels[2].mean > channels[0].mean + 6;
      toned = pipeline.modulate({ saturation: cool ? 0.72 : 0.32, brightness: lift });
      console.log(`${name.padEnd(16)} ground mean ${Math.round(mean)} -> lift x${lift.toFixed(3)}${cool ? ' (cool, colour kept)' : ''}`);

      /*
       * Seamless and nearly flat, which «Сәукеле» needed doing by hand.
       *
       * `groundSize: 'repeat'` draws the tile at page width, so a 1200x896
       * scan repeated 19 times down a 5600px document and every join showed
       * as a horizontal line. Stacking the tile on its own mirror image makes
       * the bottom row equal the top row, so the join cannot exist. And at a
       * luma sigma of 7 the repeat still reads even without seams; pulling each
       * channel towards its own mean to sigma 3 keeps the fibre and the hue.
       */
      const { data, info } = await toned.raw().toBuffer({ resolveWithObject: true });
      const n = info.width * info.height;
      const ch = info.channels;
      const means = [0, 0, 0];
      for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) means[c] += data[i * ch + c] / n;
      let lumaMean = 0;
      let lumaSq = 0;
      for (let i = 0; i < n; i++) {
        const l = 0.2126 * data[i * ch] + 0.7152 * data[i * ch + 1] + 0.0722 * data[i * ch + 2];
        lumaMean += l / n;
        lumaSq += (l * l) / n;
      }
      const sigma = Math.sqrt(Math.max(0, lumaSq - lumaMean * lumaMean));
      const k = sigma > GROUND_SIGMA ? GROUND_SIGMA / sigma : 1;
      for (let i = 0; i < n; i++) {
        for (let c = 0; c < 3; c++) {
          const o = i * ch + c;
          data[o] = Math.max(0, Math.min(255, Math.round(means[c] + (data[o] - means[c]) * k)));
        }
      }
      const raw = { width: info.width, height: info.height, channels: ch } as const;
      const mirrored = await sharp(data, { raw }).flip().raw().toBuffer();
      await sharp({ create: { width: info.width, height: info.height * 2, channels: ch as 3 | 4, background: '#ffffff' } })
        .composite([
          { input: data, raw, top: 0, left: 0 },
          { input: mirrored, raw, top: info.height, left: 0 },
        ])
        .webp({ quality: 94 })
        .toFile(out);
      console.log(
        `${name.padEnd(16)} ground sigma ${sigma.toFixed(1)} -> ${(sigma * k).toFixed(1)}, mirrored to ${info.width}x${info.height * 2}, RGB ${means.map((m) => Math.round(m)).join(',')}, ${Math.round(statSync(out).size / 1024)}KB`,
      );
      continue;
    }

    await toned.webp({ quality: 82 }).toFile(out);
    const after = Math.round(statSync(out).size / 1024);
    console.log(`${name.padEnd(16)} photo ${before}KB -> ${after}KB`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
