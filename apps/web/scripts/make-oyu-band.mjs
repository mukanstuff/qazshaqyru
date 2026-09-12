/**
 * Derive the repeating ою frieze from the single seamless tile.
 *
 *   node scripts/make-oyu-band.mjs
 *
 * `ImageElement` draws one picture; it cannot repeat one. A frieze that runs
 * the width of the page therefore has to exist as a file, and the honest way
 * to make it is to lay the owner's own tile end to end — the tile was drawn to
 * connect at its left and right edges, so this is assembly, not drawing.
 *
 * Run AFTER `prepare-template-assets.ts oyu-kit`, never before: that script
 * adopts any loose file in the folder as a source and re-keys it, and re-keying
 * an already-transparent PNG turns it into a solid black rectangle. Losing this
 * file is harmless — it is rebuilt from the tile in a second.
 */
import { mkdirSync, statSync } from 'fs';
import sharp from 'sharp';

const DIR = 'public/assets/templates/oyu-kit';
const TILE = `${DIR}/oyu-band-tile.png`;
const OUT = `${DIR}/oyu-band-x10.png`;
const COPIES = 10;
const SIZE = 256;

mkdirSync(DIR, { recursive: true });

const tile = await sharp(TILE).resize(SIZE, SIZE).png().toBuffer();
const composite = Array.from({ length: COPIES }, (_, i) => ({
  input: tile,
  left: i * SIZE,
  top: 0,
}));

await sharp({
  create: {
    width: COPIES * SIZE,
    height: SIZE,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composite)
  .png()
  .toFile(OUT);

const { width, height } = await sharp(OUT).metadata();
console.log(`oyu-band-x10.png  ${width}x${height}  ${Math.round(statSync(OUT).size / 1024)}KB`);
