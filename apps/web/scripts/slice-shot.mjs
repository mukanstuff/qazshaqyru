/**
 * Cut a full-page screenshot into readable panels.
 *
 *   node scripts/slice-shot.mjs out.png panels 5
 *
 * A finished invitation is ~6000px tall. Looked at whole it is a thumbnail
 * strip and nothing about the type is judgeable; looked at in a browser it
 * cannot be put next to a competitor's card. Five panels at 430px wide — the
 * reference services' native width — is the size at which a section can
 * actually be reviewed against theirs.
 */
import sharp from 'sharp';

const [src, outBase, nStr] = process.argv.slice(2);
if (!src || !outBase) {
  console.error('usage: node scripts/slice-shot.mjs <shot.png> <out-prefix> [panels]');
  process.exit(1);
}
const n = Number(nStr) || 5;
const { width, height } = await sharp(src).metadata();
const band = Math.ceil(height / n);
for (let i = 0; i < n; i++) {
  const top = i * band;
  const h = Math.min(band, height - top);
  if (h <= 0) break;
  await sharp(src)
    .extract({ left: 0, top, width, height: h })
    .resize({ width: 430 })
    .toFile(`${outBase}-${i + 1}.png`);
}
console.log(`sliced ${width}x${height} into ${n}`);
