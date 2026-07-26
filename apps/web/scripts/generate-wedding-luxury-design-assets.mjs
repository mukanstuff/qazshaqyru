#!/usr/bin/env node
/**
 * Designer-quality wedding-luxury assets (SVG → webp/png via sharp).
 * Champagne Atelier palette — gold floral frames, ornamental dividers.
 * Usage: node scripts/generate-wedding-luxury-design-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'assets', 'templates', 'wedding-luxury');

const CREAM = '#f7f3eb';
const CREAM_WARM = '#f0e8da';
const GOLD = '#8a7344';
const GOLD_LIGHT = '#c4a96a';
const GOLD_PALE = '#e8dcc4';
const BROWN = '#5c4a32';

async function ensureDir(rel) {
  fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
}

async function writeWebp(rel, pipeline) {
  await ensureDir(rel);
  await pipeline.webp({ quality: 88, effort: 4 }).toFile(path.join(OUT, rel));
  console.log('  wrote', rel);
}

async function writePng(rel, pipeline) {
  await ensureDir(rel);
  await pipeline.png({ compressionLevel: 9 }).toFile(path.join(OUT, rel));
  console.log('  wrote', rel);
}

function frameGreetingSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="860" height="1200" viewBox="0 0 860 1200">
  <defs>
    <linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${CREAM}"/>
      <stop offset="100%" stop-color="${CREAM_WARM}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="50%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_LIGHT}"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="1.5"/></filter>
  </defs>
  <rect width="860" height="1200" fill="url(#paper)"/>
  <!-- outer border -->
  <rect x="28" y="28" width="804" height="1144" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="0.7"/>
  <rect x="42" y="42" width="776" height="1116" fill="none" stroke="${GOLD_PALE}" stroke-width="0.75" opacity="0.5"/>
  <!-- corner florals top-left -->
  <g transform="translate(28,28)" opacity="0.85">
    <path fill="none" stroke="${GOLD}" stroke-width="1.2" d="M0 80 Q40 40 80 0 M0 50 Q25 25 50 0"/>
    <circle cx="18" cy="18" r="4" fill="${GOLD_LIGHT}" opacity="0.7"/>
    <path fill="${GOLD_LIGHT}" opacity="0.35" d="M5 35 C15 20 30 15 45 25 C30 30 20 40 5 35z"/>
    <path fill="${GOLD}" opacity="0.25" d="M25 8 C35 5 45 12 40 22 C30 18 22 15 25 8z"/>
  </g>
  <g transform="translate(832,28) scale(-1,1)" opacity="0.85">
    <path fill="none" stroke="${GOLD}" stroke-width="1.2" d="M0 80 Q40 40 80 0 M0 50 Q25 25 50 0"/>
    <circle cx="18" cy="18" r="4" fill="${GOLD_LIGHT}" opacity="0.7"/>
    <path fill="${GOLD_LIGHT}" opacity="0.35" d="M5 35 C15 20 30 15 45 25 C30 30 20 40 5 35z"/>
  </g>
  <g transform="translate(28,1172) scale(1,-1)" opacity="0.85">
    <path fill="none" stroke="${GOLD}" stroke-width="1.2" d="M0 80 Q40 40 80 0"/>
    <circle cx="18" cy="18" r="4" fill="${GOLD_LIGHT}" opacity="0.7"/>
  </g>
  <g transform="translate(832,1172) scale(-1,-1)" opacity="0.85">
    <path fill="none" stroke="${GOLD}" stroke-width="1.2" d="M0 80 Q40 40 80 0"/>
    <circle cx="18" cy="18" r="4" fill="${GOLD_LIGHT}" opacity="0.7"/>
  </g>
  <!-- center watermark ornament -->
  <ellipse cx="430" cy="600" rx="180" ry="220" fill="${GOLD_PALE}" opacity="0.12" filter="url(#soft)"/>
  <path fill="none" stroke="${GOLD}" stroke-width="0.8" opacity="0.2"
    d="M430 480 Q480 520 430 560 Q380 520 430 480 Q430 640 480 680 Q430 720 380 680 Q430 640 430 480"/>
</svg>`);
}

function frameDateSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="860" height="900" viewBox="0 0 860 900">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${CREAM}"/>
      <stop offset="100%" stop-color="${CREAM_WARM}"/>
    </linearGradient>
  </defs>
  <rect width="860" height="900" fill="url(#p)"/>
  <rect x="32" y="32" width="796" height="836" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.65" rx="2"/>
  <rect x="48" y="48" width="764" height="804" fill="none" stroke="${GOLD_PALE}" stroke-width="0.6" opacity="0.45"/>
  <!-- side flourishes -->
  <path fill="none" stroke="${GOLD_LIGHT}" stroke-width="1" opacity="0.5"
    d="M60 450 Q100 400 60 350 M60 550 Q100 500 60 450"/>
  <path fill="none" stroke="${GOLD_LIGHT}" stroke-width="1" opacity="0.5" transform="scale(-1,1) translate(-860,0)"
    d="M60 450 Q100 400 60 350 M60 550 Q100 500 60 450"/>
  <!-- top arch -->
  <path fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.4"
    d="M200 80 Q430 40 660 80"/>
</svg>`);
}

function countdownBgSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="860" height="320" viewBox="0 0 860 320">
  <rect width="860" height="320" fill="${CREAM_WARM}"/>
  <rect x="20" y="20" width="820" height="280" fill="none" stroke="${GOLD_PALE}" stroke-width="1" rx="4" opacity="0.6"/>
  <line x1="40" y1="160" x2="820" y2="160" stroke="${GOLD_PALE}" stroke-width="0.5" opacity="0.3"/>
</svg>`);
}

function dividerHeroSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="48" viewBox="0 0 400 48">
  <line x1="20" y1="24" x2="155" y2="24" stroke="${GOLD}" stroke-width="0.8" opacity="0.55"/>
  <path fill="${GOLD_LIGHT}" opacity="0.8" d="M200 24 L210 14 L220 24 L210 34 Z"/>
  <circle cx="200" cy="24" r="5" fill="none" stroke="${GOLD}" stroke-width="0.8"/>
  <line x1="245" y1="24" x2="380" y2="24" stroke="${GOLD}" stroke-width="0.8" opacity="0.55"/>
</svg>`);
}

function dividerCardSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="24" viewBox="0 0 320 24">
  <line x1="10" y1="12" x2="130" y2="12" stroke="${GOLD}" stroke-width="0.6" opacity="0.5"/>
  <circle cx="160" cy="12" r="3" fill="${GOLD_LIGHT}"/>
  <line x1="190" y1="12" x2="310" y2="12" stroke="${GOLD}" stroke-width="0.6" opacity="0.5"/>
</svg>`);
}

function dividerRoseSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="40" viewBox="0 0 280 40">
  <line x1="0" y1="20" x2="110" y2="20" stroke="${GOLD}" stroke-width="0.7" opacity="0.45"/>
  <g transform="translate(140,20)">
    <circle r="6" fill="${GOLD_LIGHT}" opacity="0.5"/>
    <ellipse rx="10" ry="6" fill="${GOLD}" opacity="0.25" transform="rotate(0)"/>
    <ellipse rx="10" ry="6" fill="${GOLD}" opacity="0.25" transform="rotate(72)"/>
    <ellipse rx="10" ry="6" fill="${GOLD}" opacity="0.25" transform="rotate(144)"/>
    <ellipse rx="10" ry="6" fill="${GOLD}" opacity="0.25" transform="rotate(216)"/>
    <ellipse rx="10" ry="6" fill="${GOLD}" opacity="0.25" transform="rotate(288)"/>
    <circle r="3" fill="${GOLD}"/>
  </g>
  <line x1="170" y1="20" x2="280" y2="20" stroke="${GOLD}" stroke-width="0.7" opacity="0.45"/>
</svg>`);
}

function confettiSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <g opacity="0.75">
    <rect x="30" y="40" width="8" height="14" fill="${GOLD_LIGHT}" transform="rotate(25 34 47)" rx="1"/>
    <rect x="80" y="20" width="6" height="12" fill="${GOLD}" transform="rotate(-15 83 26)" rx="1"/>
    <rect x="140" y="55" width="7" height="13" fill="${GOLD_PALE}" transform="rotate(45 143 61)" rx="1"/>
    <rect x="50" y="100" width="9" height="15" fill="${GOLD_LIGHT}" transform="rotate(-30 54 107)" rx="1"/>
    <rect x="120" y="90" width="6" height="11" fill="${GOLD}" transform="rotate(60 123 95)" rx="1"/>
    <rect x="170" y="130" width="8" height="14" fill="${GOLD_PALE}" transform="rotate(-45 174 137)" rx="1"/>
    <circle cx="100" cy="60" r="4" fill="${GOLD_LIGHT}" opacity="0.6"/>
    <circle cx="160" cy="170" r="3" fill="${GOLD}" opacity="0.5"/>
    <circle cx="40" cy="160" r="3.5" fill="${GOLD_PALE}" opacity="0.55"/>
  </g>
</svg>`);
}

function cornerOrnamentSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>
  <path fill="url(#g)" opacity="0.88"
    d="M0 0h200c-25 50-38 110-38 170 0 85 35 160 90 220H0V0zm55 55c-18 42-30 90-30 145 0 65 24 125 65 175C60 340 30 260 30 170 30 115 42 68 55 55z"/>
  <path fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.5"
    d="M15 15 Q80 15 120 55 Q15 80 15 15"/>
  <circle cx="105" cy="105" r="9" fill="${GOLD_LIGHT}" opacity="0.55"/>
  <path fill="${GOLD}" opacity="0.3" d="M70 40 C90 30 115 45 105 65 C85 55 75 50 70 40z"/>
  <path fill="${GOLD_LIGHT}" opacity="0.25" d="M40 90 C55 70 80 65 95 85 C75 90 55 95 40 90z"/>
</svg>`);
}

function heroPosterSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="860" height="1200" viewBox="0 0 860 1200">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d4c4a8"/>
      <stop offset="40%" stop-color="#b8a080"/>
      <stop offset="100%" stop-color="${CREAM_WARM}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#fff8ee" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="860" height="1200" fill="url(#sky)"/>
  <rect width="860" height="1200" fill="url(#glow)"/>
  <!-- bokeh circles -->
  <circle cx="200" cy="300" r="80" fill="#fff" opacity="0.08"/>
  <circle cx="650" cy="450" r="120" fill="#fff" opacity="0.06"/>
  <circle cx="400" cy="200" r="60" fill="${GOLD_PALE}" opacity="0.15"/>
  <!-- bottom fade -->
  <rect x="0" y="900" width="860" height="300" fill="${CREAM_WARM}" opacity="0.85"/>
  <path fill="${GOLD}" opacity="0.08" d="M0 950 Q430 900 860 950 L860 1200 L0 1200 Z"/>
</svg>`);
}

function paperTextureSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.04"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="1920" height="1080" fill="${CREAM}"/>
  <rect width="1920" height="1080" filter="url(#noise)" opacity="0.5"/>
  <rect width="1920" height="1080" fill="url(#warm)" opacity="0"/>
</svg>`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('Generating wedding-luxury design assets →', OUT);

  await writeWebp('backgrounds/frame-greeting.webp', sharp(frameGreetingSvg()).resize(860, 1200));
  await writeWebp('backgrounds/frame-date.webp', sharp(frameDateSvg()).resize(860, 900));
  await writeWebp('backgrounds/countdown-bg.webp', sharp(countdownBgSvg()).resize(860, 320));
  await writeWebp('backgrounds/bg-paper-01.webp', sharp(paperTextureSvg()).resize(1920, 1080));

  await writeWebp('hero/hero-poster.webp', sharp(heroPosterSvg()).resize(860, 1200));
  await writeWebp('hero/hero-01.webp', sharp(heroPosterSvg()).resize(1920, 1080));

  await writePng('dividers/divider-hero.png', sharp(dividerHeroSvg()).resize(400, 48));
  await writePng('dividers/divider-card.png', sharp(dividerCardSvg()).resize(320, 24));
  await writePng('dividers/divider-rose.png', sharp(dividerRoseSvg()).resize(280, 40));
  await writePng('dividers/divider-01.png', sharp(dividerHeroSvg()).resize(400, 48));

  await writePng('ornaments/confetti-l.png', sharp(confettiSvg()).resize(220, 220));
  await writePng('ornaments/confetti-r.png', sharp(confettiSvg()).resize(220, 220).flop());

  const corner = sharp(cornerOrnamentSvg()).resize(512, 512);
  for (const name of ['corner-01', 'corner-02', 'corner-03', 'corner-04']) {
    await writePng(`ornaments/${name}.png`, corner.clone());
  }

  await writePng('ornaments/dress-art.png', sharp(dividerRoseSvg()).resize(260, 80).extend({
    top: 40, bottom: 40, left: 40, right: 40,
    background: { r: 247, g: 243, b: 235, alpha: 0 },
  }));

  const grain = sharp({
    create: { width: 512, height: 512, channels: 3, background: { r: 128, g: 128, b: 128 } },
  });
  await writeWebp('overlays/overlay-grain-01.webp', grain.clone());
  await writeWebp('overlays/overlay-vignette-01.webp', grain.clone());

  await writeWebp(
    'preview.jpg',
    sharp(heroPosterSvg()).resize(800, 1000).jpeg({ quality: 90 }),
  ).catch(() =>
    sharp(heroPosterSvg()).resize(800, 1000).webp({ quality: 90 }).toFile(path.join(OUT, 'preview.webp')),
  );

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
