#!/usr/bin/env node
/**
 * Procedural wedding-luxury placeholders when AI generation is unavailable.
 * Usage: node scripts/seed-wedding-luxury-placeholders.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'assets', 'templates', 'wedding-luxury');

const CREAM = '#f5f0e8';
const GOLD = '#6e6845';
const GOLD_LIGHT = '#c9b896';

async function ensureDir(rel) {
  const dir = path.dirname(path.join(OUT, rel));
  fs.mkdirSync(dir, { recursive: true });
}

async function writeWebp(rel, pipeline) {
  await ensureDir(rel);
  await pipeline.webp({ quality: 85 }).toFile(path.join(OUT, rel));
  console.log('  wrote', rel);
}

async function writePng(rel, pipeline) {
  await ensureDir(rel);
  await pipeline.png().toFile(path.join(OUT, rel));
  console.log('  wrote', rel);
}

async function writeJpg(rel, pipeline) {
  await ensureDir(rel);
  await pipeline.jpeg({ quality: 88 }).toFile(path.join(OUT, rel));
  console.log('  wrote', rel);
}

function cornerSvg() {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  <path fill="url(#g)" opacity="0.92"
    d="M0 0h180c-20 40-30 90-30 140 0 70 30 130 80 180H0V0zm40 40c-15 35-25 75-25 120 0 55 20 105 55 145C45 255 25 195 25 140 25 95 35 55 40 40z"/>
  <circle cx="95" cy="95" r="8" fill="${GOLD}" opacity="0.5"/>
  <circle cx="130" cy="55" r="5" fill="${GOLD_LIGHT}" opacity="0.6"/>
</svg>`);
}

function dividerSvg() {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="40" viewBox="0 0 600 40">
  <line x1="40" y1="20" x2="260" y2="20" stroke="${GOLD}" stroke-width="1" opacity="0.6"/>
  <circle cx="300" cy="20" r="6" fill="${GOLD_LIGHT}"/>
  <line x1="340" y1="20" x2="560" y2="20" stroke="${GOLD}" stroke-width="1" opacity="0.6"/>
</svg>`);
}

function frameSvg() {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect x="24" y="24" width="752" height="952" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.55"/>
  <rect x="40" y="40" width="720" height="920" fill="none" stroke="${GOLD_LIGHT}" stroke-width="1" opacity="0.4"/>
</svg>`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('Seeding wedding-luxury placeholders →', OUT);

  const paperNoise = sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: CREAM,
    },
  }).png();

  await writeWebp('backgrounds/bg-paper-01.webp', paperNoise.clone());
  await writeWebp('backgrounds/bg-silk-01.webp', paperNoise.clone());
  await writeWebp('backgrounds/bg-marble-01.webp', paperNoise.clone());
  await writeWebp('backgrounds/bg-grain-01.webp', paperNoise.clone());

  const hero = sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: { r: 95, g: 85, b: 68 },
    },
  });

  await writeWebp('hero/hero-01.webp', hero.clone());
  await writeWebp('hero/hero-02.webp', hero.clone());

  const corner = sharp(cornerSvg()).resize(512, 512);
  for (const name of ['corner-01', 'corner-02', 'corner-03', 'corner-04']) {
    await writePng(`ornaments/${name}.png`, corner.clone());
  }
  await writePng('ornaments/frame-01.png', sharp(frameSvg()).resize(800, 1000));
  await writePng('ornaments/frame-02.png', sharp(frameSvg()).resize(800, 1000));
  await writePng('ornaments/emblem-01.png', sharp(dividerSvg()).resize(200, 200));
  await writePng('ornaments/emblem-02.png', sharp(dividerSvg()).resize(200, 200));

  const divider = sharp(dividerSvg()).resize(600, 40);
  for (const name of ['divider-01', 'divider-02', 'divider-03', 'divider-04']) {
    await writePng(`dividers/${name}.png`, divider.clone());
  }

  const grain = sharp({
    create: {
      width: 512,
      height: 512,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
    },
  });
  await writeWebp('overlays/overlay-grain-01.webp', grain.clone());
  await writeWebp('overlays/overlay-vignette-01.webp', grain.clone());
  await writeWebp('overlays/overlay-glow-01.webp', grain.clone());

  await writeJpg(
    'preview.jpg',
    hero.clone().resize(800, 1000),
  );

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
