/**
 * Where in this picture can type actually go?
 *
 *   node scripts/measure-frame.mjs public/assets/templates/saukele/hero-poster.webp
 *   node scripts/measure-frame.mjs <image> --box=390x720 --bands=20 --x=10-90
 *
 * A glow separates type from a quiet ground. It cannot separate it from folds,
 * a ribbon or hair, and no amount of shadow will — the answer there is to move
 * the block, which means knowing where the quiet part of the frame is before
 * the section is written rather than after the owner says he cannot read it.
 *
 * Three numbers per horizontal band, all inside the column the text will
 * occupy (`--x`, per cent of the box, default 10-90):
 *
 *   mean      average luminance. Says almost nothing on its own.
 *   p05       fifth percentile — how dark the DARKEST parts are. This is what
 *             passes behind the letters and breaks them up.
 *   texture   mean absolute local gradient. How busy the band is.
 *
 * Read p05 and texture together. On the frame this was written for, the sky
 * band ran p05 0.80-0.85 at texture 0.005-0.011, and the dress 15 bands lower
 * ran 0.41-0.67 at 0.033-0.086 — six to fifteen times busier, with real dark
 * pixels in it. Moving three lines of type from the second into the first took
 * their worst-case contrast from 6.6:1 to 11.4:1.
 *
 * `--box` is the element box the image is drawn into, so the printed y values
 * are the ones to write into the builder. Cover-cropping is applied the same
 * way the renderer does it.
 */
import sharp from 'sharp';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const arg = (name, dflt) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : dflt;
};

if (!file) {
  console.error('usage: node scripts/measure-frame.mjs <image> [--box=390x720] [--bands=20] [--x=10-90]');
  process.exit(2);
}

const [boxW, boxH] = arg('box', '390x720').split('x').map(Number);
const bandH = Number(arg('bands', '20'));
const [xFrom, xTo] = arg('x', '10-90').split('-').map(Number);

const srgbToLinear = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
const { width: iw, height: ih, channels } = info;
const L = (x, y) => {
  const i = (y * iw + x) * channels;
  return (
    0.2126 * srgbToLinear(data[i]) +
    0.7152 * srgbToLinear(data[i + 1]) +
    0.0722 * srgbToLinear(data[i + 2])
  );
};

// object-fit: cover — the renderer's own rule for a photograph in a box.
const scale = Math.max(boxW / iw, boxH / ih);
const drawnW = iw * scale;
const drawnH = ih * scale;
const offX = (drawnW - boxW) / 2;
const offY = (drawnH - boxH) / 2;
const srcX = (cx) => Math.min(iw - 3, Math.max(0, Math.round((cx + offX) / scale)));
const srcY = (cy) => Math.min(ih - 3, Math.max(0, Math.round((cy + offY) / scale)));

const rows = [];
for (let cy = 0; cy + bandH <= boxH; cy += bandH) {
  const vals = [];
  let grad = 0;
  let n = 0;
  for (let y = srcY(cy); y < srcY(cy + bandH); y += 2) {
    for (let x = srcX((boxW * xFrom) / 100); x < srcX((boxW * xTo) / 100); x += 2) {
      const v = L(x, y);
      vals.push(v);
      grad += Math.abs(v - L(x + 2, y)) + Math.abs(v - L(x, y + 2));
      n += 1;
    }
  }
  if (!vals.length) continue;
  vals.sort((a, b) => a - b);
  rows.push({
    y: cy,
    mean: vals.reduce((s, v) => s + v, 0) / vals.length,
    p05: vals[Math.floor(vals.length * 0.05)],
    texture: grad / n,
  });
}

console.log(`\n${file}  ${iw}x${ih}  drawn into ${boxW}x${boxH}, columns ${xFrom}-${xTo}%\n`);
console.log('   y   mean   p05   texture');
for (const r of rows) {
  const quiet = r.p05 >= 0.72 && r.texture <= 0.02;
  console.log(
    `${String(r.y).padStart(4)}  ${r.mean.toFixed(3)}  ${r.p05.toFixed(3)}  ${r.texture.toFixed(4)}${quiet ? '   quiet' : ''}`,
  );
}

// The longest run of quiet bands is the field to put the names in.
let best = null;
let run = null;
for (const r of rows) {
  const quiet = r.p05 >= 0.72 && r.texture <= 0.02;
  if (quiet) {
    run = run ?? { from: r.y, to: r.y };
    run.to = r.y + bandH;
  } else if (run) {
    if (!best || run.to - run.from > best.to - best.from) best = run;
    run = null;
  }
}
if (run && (!best || run.to - run.from > best.to - best.from)) best = run;

console.log(
  best
    ? `\nquiet field: y ${best.from}..${best.to} (${best.to - best.from}px of the ${boxH}px box)\n`
    : '\nno quiet field in this frame — type here needs a panel behind it, not a shadow\n',
);
