/**
 * Generate a soft painted ground procedurally.
 *
 * A flat colour fill is the single clearest tell that a template is a web page
 * rather than a printed card — competitor heroes all sit on a painted wash with
 * visible paper tooth. We cannot paint one and cannot reach an image model, but
 * a wash is not really an illustration: it is a few broad colour fields bleeding
 * into each other plus grain. That is reproducible with maths.
 *
 * Method: lay coloured ellipses on the cream base, blur them far past the point
 * where their outlines survive, then dust the result with fine monochrome noise
 * so the flatness of a digital gradient is broken up.
 *
 *   pnpm ground <name> <hexBase> <hexA> <hexB> [width] [height]
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const OUT_DIR = join(process.cwd(), 'public', 'assets', 'grounds');

interface Blob {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
}

function washSvg(w: number, h: number, blobs: Blob[]): Buffer {
  const shapes = blobs
    .map(
      (b) =>
        `<ellipse cx="${b.cx}" cy="${b.cy}" rx="${b.rx}" ry="${b.ry}" ` +
        `fill="${b.color}" fill-opacity="${b.opacity}" />`
    )
    .join('');
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${shapes}</svg>`
  );
}

/** Fine monochrome grain, so the wash reads as paper rather than a gradient. */
function grain(w: number, h: number, strength: number): Buffer {
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    const v = 128 + (Math.random() * 2 - 1) * strength;
    const o = i * 4;
    buf[o] = buf[o + 1] = buf[o + 2] = Math.max(0, Math.min(255, v));
    buf[o + 3] = 26;
  }
  return buf;
}

async function main() {
  const [name, base, a, b, wArg, hArg] = process.argv.slice(2);
  if (!name || !base || !a || !b) {
    console.error('usage: pnpm ground <name> <hexBase> <hexA> <hexB> [width] [height]');
    process.exit(1);
  }
  const w = Number(wArg ?? 780);
  const h = Number(hArg ?? 1440);

  // Placed asymmetrically on purpose: a symmetrical wash reads as a gradient,
  // an off-balance one reads as something that was painted.
  const blobs: Blob[] = [
    { cx: w * 0.12, cy: h * 0.1, rx: w * 0.55, ry: h * 0.2, color: a, opacity: 0.55 },
    { cx: w * 0.92, cy: h * 0.26, rx: w * 0.5, ry: h * 0.18, color: b, opacity: 0.45 },
    { cx: w * 0.3, cy: h * 0.62, rx: w * 0.65, ry: h * 0.22, color: b, opacity: 0.32 },
    { cx: w * 0.85, cy: h * 0.88, rx: w * 0.6, ry: h * 0.2, color: a, opacity: 0.4 },
    { cx: w * 0.5, cy: h * 0.42, rx: w * 0.45, ry: h * 0.14, color: '#ffffff', opacity: 0.5 },
  ];

  const wash = await sharp(washSvg(w, h, blobs))
    .blur(Math.round(Math.min(w, h) * 0.09))
    .png()
    .toBuffer();

  mkdirSync(OUT_DIR, { recursive: true });

  const out = await sharp({ create: { width: w, height: h, channels: 4, background: base } })
    .composite([
      { input: wash, blend: 'over' },
      { input: grain(w, h, 40), raw: { width: w, height: h, channels: 4 }, blend: 'overlay' },
    ])
    .webp({ quality: 92 })
    .toBuffer();

  const file = join(OUT_DIR, `${name}.webp`);
  writeFileSync(file, out);
  console.log(`${file}  ${w}x${h}  ${(out.length / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
