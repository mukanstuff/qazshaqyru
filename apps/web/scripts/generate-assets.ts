/**
 * Generate template artwork with the Gemini image model, then post-process it
 * into assets the canvas can actually use.
 *
 *   pnpm assets:gen --probe          # small first batch, check the style
 *   pnpm assets:gen                  # everything in the manifest
 *   pnpm assets:gen --only arch-frame-slim
 *   pnpm assets:gen --probe --dry-run
 *
 * The key is read from GEMINI_API_KEY in apps/web/.env.local (gitignored) and
 * is never printed, logged or written to disk by this script.
 *
 * Post-processing is the part that matters. A raw generation is a rectangular
 * PNG on white; an `ornament` element needs an alpha mask so the renderer can
 * fill it with each theme's accent colour. So for `kind: 'mask'` we key
 * luminance to alpha (white → transparent, black → opaque), trim the empty
 * margin, and write PNG. For `kind: 'image'` the artwork keeps its own colour
 * and only gets trimmed and converted to WebP.
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { ASSET_PROMPTS, type AssetKind, type AssetPrompt } from './asset-prompts';

const OUT_DIR = join(process.cwd(), 'public', 'assets', 'generated');
const RAW_DIR = join(OUT_DIR, 'raw');

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  inline_data?: { mime_type: string; data: string };
}

function loadEnvLocal(): void {
  // Next loads .env.local for the app, but this script runs standalone.
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  const text = require('fs').readFileSync(path, 'utf8') as string;
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

async function generate(prompt: string, apiKey: string, model: string): Promise<Buffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    // Surface the API's own message — quota and model-name errors are the two
    // most likely failures and both are self-explanatory once shown.
    throw new Error(`HTTP ${res.status}: ${bodyText.slice(0, 600)}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(bodyText);
  } catch {
    throw new Error(`Response was not JSON: ${bodyText.slice(0, 300)}`);
  }

  const parts =
    (json as { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> }).candidates?.[0]
      ?.content?.parts ?? [];

  for (const part of parts) {
    const data = part.inlineData?.data ?? part.inline_data?.data;
    if (data) return Buffer.from(data, 'base64');
  }

  const textPart = parts.find((p) => p.text)?.text;
  throw new Error(
    `No image in response.${textPart ? ` Model said: ${textPart.slice(0, 300)}` : ''}`
  );
}

/**
 * Turn dark-on-white line art into an alpha mask.
 *
 * Alpha is taken from inverted luminance, and the RGB channels are forced to
 * black, so the PNG carries shape only. The renderer supplies the colour.
 */
async function toMask(input: Buffer, width: number): Promise<Buffer> {
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const out = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0, o = 0; i < data.length; i += channels, o += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // Slight headroom at both ends: near-white becomes fully transparent and
    // near-black fully opaque, so JPEG-ish noise does not leave a grey haze.
    const alpha = Math.max(0, Math.min(255, Math.round(((245 - luma) / 210) * 255)));
    out[o] = 0;
    out[o + 1] = 0;
    out[o + 2] = 0;
    out[o + 3] = alpha;
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .trim({ threshold: 1 })
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Key a white background to transparency while keeping the artwork's colour.
 *
 * `toMask` cannot do this: it throws the pixel away and keeps only its
 * luminance as alpha, which is right for black line art and destroys a gold
 * ornament — the highlights that make it read as metal become the most
 * transparent part of the image. Here alpha comes from how far the pixel is
 * from white, and the colour is carried through unchanged, with the residual
 * white unmixed out of the semi-transparent edge so it does not leave a pale
 * halo on a dark page.
 */
async function toFoil(input: Buffer, width: number): Promise<Buffer> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const out = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0, o = 0; i < data.length; i += channels, o += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Distance from white on the brightest channel: a saturated gold keeps
    // full opacity, paper white drops to zero.
    const maxc = Math.max(r, g, b);
    const minc = Math.min(r, g, b);
    // Saturation rescues bright gold highlights, which are close to white in
    // luminance but nowhere near neutral.
    const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
    const fromWhite = (255 - minc) / 255;
    const alpha = Math.max(0, Math.min(1, Math.max(fromWhite * 1.35 - 0.06, sat * 1.6)));

    if (alpha <= 0.004) {
      out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      continue;
    }
    // Un-premultiply against the white it was composited on, so the edge keeps
    // the ornament's colour rather than a washed-out version of it.
    const unmix = (c: number) => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - alpha)) / alpha)));
    out[o] = unmix(r);
    out[o + 1] = unmix(g);
    out[o + 2] = unmix(b);
    out[o + 3] = Math.round(alpha * 255);
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .trim({ threshold: 1 })
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function toImage(input: Buffer, width: number): Promise<Buffer> {
  return sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
}

/**
 * Process artwork that was generated by hand instead of through the API.
 *
 * Image generation on the Gemini API needs a billed Cloud project — a Google
 * AI subscription covers the AI Studio *web app* only, and the two use
 * different meters. Generating in the browser and dropping the downloads into
 * `raw/` is therefore a legitimate path, not a workaround: the post-processing
 * is where the value is, and it does not care how the pixels arrived.
 *
 * Files are matched to the manifest by filename stem, which decides whether
 * they become an alpha mask or keep their colour. Anything unmatched is
 * skipped with a note rather than guessed at.
 */
/**
 * Id selector shared by both paths: an exact id, a comma-separated list, or a
 * trailing `*` for a family — `--only oyu-*` covers one template's whole set.
 */
function makeIdFilter(onlyId: string | null | undefined): (id: string) => boolean {
  if (!onlyId) return () => true;
  const wanted = onlyId.split(',').map((v) => v.trim()).filter(Boolean);
  return (id) =>
    wanted.some((w) => (w.endsWith('*') ? id.startsWith(w.slice(0, -1)) : id === w));
}

async function processRaw(args: string[]): Promise<void> {
  const { readdirSync } = require('fs') as typeof import('fs');
  if (!existsSync(RAW_DIR)) {
    console.error(`nothing to process — ${RAW_DIR} does not exist`);
    process.exit(1);
  }

  const kindIdx = args.indexOf('--kind');
  const kindOverride = kindIdx >= 0 ? (args[kindIdx + 1] as AssetKind) : null;
  const onlyIdx = args.indexOf('--only');
  // Without a filter this reprocessed every file ever dropped in the folder, so
  // adding artwork for one template republished the artwork of every other one.
  const matches = makeIdFilter(onlyIdx >= 0 ? args[onlyIdx + 1] : null);

  const files = readdirSync(RAW_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .filter((f) => matches(f.replace(/\.[^.]+$/, '')));
  if (files.length === 0) {
    console.error(`no matching images in ${RAW_DIR}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;

  for (const file of files) {
    const stem = file.replace(/\.[^.]+$/, '');
    const entry = ASSET_PROMPTS.find((p) => p.id === stem);
    const kind = kindOverride ?? entry?.kind;

    if (!kind) {
      console.log(`${stem} ... skipped (not in manifest; pass --kind mask|image)`);
      continue;
    }

    process.stdout.write(`${stem} ... `);
    try {
      const raw = require('fs').readFileSync(join(RAW_DIR, file)) as Buffer;
      const width = entry?.width ?? 900;
      if (kind === 'mask') {
        const mask = await toMask(raw, width);
        writeFileSync(join(OUT_DIR, `${stem}.png`), mask);
        console.log(`ok  (mask, ${(mask.length / 1024).toFixed(0)} KB)`);
      } else if (kind === 'foil') {
        const foil = await toFoil(raw, width);
        writeFileSync(join(OUT_DIR, `${stem}.png`), foil);
        console.log(`ok  (foil, ${(foil.length / 1024).toFixed(0)} KB)`);
      } else {
        const img = await toImage(raw, width);
        writeFileSync(join(OUT_DIR, `${stem}.webp`), img);
        console.log(`ok  (image, ${(img.length / 1024).toFixed(0)} KB)`);
      }
      ok += 1;
    } catch (err) {
      console.log('FAILED');
      console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n${ok}/${files.length} processed → public/assets/generated/`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const probeOnly = args.includes('--probe');
  const onlyIdx = args.indexOf('--only');
  const onlyId = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

  if (args.includes('--from-raw')) {
    await processRaw(args);
    return;
  }

  // `--only` takes an exact id, a comma-separated list, or a trailing `*` to
  // match a family — `--only oyu-*` is how the whole set for one template gets
  // dumped or regenerated in one go.
  let queue: AssetPrompt[] = ASSET_PROMPTS;
  if (onlyId) {
    const matches = makeIdFilter(onlyId);
    queue = queue.filter((p) => matches(p.id));
  } else if (probeOnly) queue = queue.filter((p) => p.probe);

  if (queue.length === 0) {
    console.error('nothing matched — check --only id');
    process.exit(1);
  }

  console.log(`${queue.length} asset(s): ${queue.map((q) => q.id).join(', ')}`);

  if (dryRun) {
    for (const p of queue) {
      console.log(`\n── ${p.id} [${p.kind}] ──\n${p.prompt}`);
    }
    console.log('\ndry run — nothing generated');
    return;
  }

  loadEnvLocal();
  const apiKey = process.env.GEMINI_API_KEY;
  // Default to the quality model rather than the cheap one: these assets are
  // authored once and then ship in every template, so a few cents per image
  // is irrelevant next to the cost of mediocre artwork.
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image';

  if (!apiKey) {
    console.error(
      'GEMINI_API_KEY is not set.\n' +
        "Add it to apps/web/.env.local:  echo 'GEMINI_API_KEY=...' >> .env.local"
    );
    process.exit(1);
  }

  mkdirSync(RAW_DIR, { recursive: true });

  let ok = 0;
  for (const p of queue) {
    process.stdout.write(`${p.id} ... `);
    try {
      const raw = await generate(p.prompt, apiKey, model);
      writeFileSync(join(RAW_DIR, `${p.id}.png`), raw);

      const width = p.width ?? 800;
      if (p.kind === 'mask') {
        const mask = await toMask(raw, width);
        writeFileSync(join(OUT_DIR, `${p.id}.png`), mask);
        console.log(`ok  (mask, ${(mask.length / 1024).toFixed(0)} KB)`);
      } else if (p.kind === 'foil') {
        const foil = await toFoil(raw, width);
        writeFileSync(join(OUT_DIR, `${p.id}.png`), foil);
        console.log(`ok  (foil, ${(foil.length / 1024).toFixed(0)} KB)`);
      } else {
        const img = await toImage(raw, width);
        writeFileSync(join(OUT_DIR, `${p.id}.webp`), img);
        console.log(`ok  (image, ${(img.length / 1024).toFixed(0)} KB)`);
      }
      ok += 1;
    } catch (err) {
      console.log('FAILED');
      console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\n${ok}/${queue.length} generated → public/assets/generated/`);
  if (ok > 0) console.log('originals kept in public/assets/generated/raw/ for re-processing');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
