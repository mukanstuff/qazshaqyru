/**
 * Combinatorial template asset expansion.
 * Copies wedding-luxury / kyz-traditional packs into variant folders + preview.jpg
 *
 * Usage: node scripts/expand-templates.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../public/assets/templates');
const LUXURY = path.join(ROOT, 'wedding-luxury');
const KAZAKH = path.join(ROOT, 'kyz-traditional');

/** @typedef {{ family: 'luxury' | 'kazakh', bg?: string, hero?: string, divider?: string, dividerThin?: string, frame?: string }} VariantSpec */

/** @type {Record<string, VariantSpec>} */
const VARIANTS = {
  // ── Frame family (10) ──
  'wedding-luxury': { family: 'luxury', bg: 'bg-paper-01', hero: 'hero-01', divider: 'divider-01', dividerThin: 'divider-02', frame: 'frame-01' },
  'wedding-ivory-gold': { family: 'luxury', bg: 'bg-paper-01', hero: 'hero-01', divider: 'divider-01', dividerThin: 'divider-02', frame: 'frame-01' },
  'wedding-oriental': { family: 'luxury', bg: 'bg-marble-01', hero: 'hero-02', divider: 'divider-03', dividerThin: 'divider-04', frame: 'frame-02' },
  'toy-amber-lux': { family: 'luxury', bg: 'bg-grain-01', hero: 'hero-01', divider: 'divider-02', dividerThin: 'divider-03', frame: 'frame-01' },
  'betashar-gold-frame': { family: 'luxury', bg: 'bg-silk-01', hero: 'hero-02', divider: 'divider-01', dividerThin: 'divider-02', frame: 'frame-01' },
  'kyz-elegant': { family: 'luxury', bg: 'bg-marble-01', hero: 'hero-02', divider: 'divider-04', dividerThin: 'divider-01', frame: 'frame-01' },
  'anniversary-gold': { family: 'luxury', bg: 'bg-silk-01', hero: 'hero-01', divider: 'divider-03', dividerThin: 'divider-04', frame: 'frame-02' },
  'frame-ochre-classic': { family: 'luxury', bg: 'bg-grain-01', hero: 'hero-02', divider: 'divider-01', dividerThin: 'divider-02', frame: 'frame-01' },
  'frame-terracotta-luxe': { family: 'luxury', bg: 'bg-marble-01', hero: 'hero-01', divider: 'divider-04', dividerThin: 'divider-01', frame: 'frame-02' },
  'frame-mustard-editorial': { family: 'luxury', bg: 'bg-paper-01', hero: 'hero-02', divider: 'divider-02', dividerThin: 'divider-03', frame: 'frame-01' },

  // ── Kazakh-scroll family (5) ──
  'kyz-traditional': { family: 'kazakh' },
  'kyz-ochre-traditional': { family: 'kazakh' },
  'kyz-terracotta-ethno': { family: 'kazakh' },
  'kyz-sage-scroll': { family: 'kazakh' },
  'kyz-rose-ethno': { family: 'kazakh' },

  // ── Dark-lux family (5) ──
  'wedding-midnight': { family: 'luxury', bg: 'bg-grain-01', hero: 'hero-02', divider: 'divider-03', dividerThin: 'divider-04', frame: 'frame-02' },
  'toy-midnight': { family: 'luxury', bg: 'bg-grain-01', hero: 'hero-01', divider: 'divider-04', dividerThin: 'divider-01', frame: 'frame-01' },
  'birthday-luxury': { family: 'luxury', bg: 'bg-grain-01', hero: 'hero-02', divider: 'divider-02', dividerThin: 'divider-03', frame: 'frame-02' },
  'dark-lux-onyx-gold': { family: 'luxury', bg: 'bg-grain-01', hero: 'hero-01', divider: 'divider-01', dividerThin: 'divider-02', frame: 'frame-01' },
  'dark-lux-midnight-amber': { family: 'luxury', bg: 'bg-silk-01', hero: 'hero-02', divider: 'divider-03', dividerThin: 'divider-04', frame: 'frame-02' },

  // ── Other layouts — luxury pack + flat aliases for fullbleed/split/editorial ──
  'wedding-rose-blush': { family: 'luxury', bg: 'bg-paper-01', hero: 'hero-01', divider: 'divider-01', dividerThin: 'divider-02', frame: 'frame-01' },
  'wedding-sage-minimal': { family: 'luxury', bg: 'bg-marble-01', hero: 'hero-02', divider: 'divider-02', dividerThin: 'divider-03', frame: 'frame-01' },
  'toy-summer': { family: 'luxury', bg: 'bg-silk-01', hero: 'hero-01', divider: 'divider-01', dividerThin: 'divider-02', frame: 'frame-01' },
  'toy-forest': { family: 'luxury', bg: 'bg-grain-01', hero: 'hero-02', divider: 'divider-03', dividerThin: 'divider-04', frame: 'frame-01' },
  'toy-rose-romance': { family: 'luxury', bg: 'bg-paper-01', hero: 'hero-02', divider: 'divider-02', dividerThin: 'divider-03', frame: 'frame-01' },
  'betashar-peach': { family: 'luxury', bg: 'bg-paper-01', hero: 'hero-01', divider: 'divider-01', dividerThin: 'divider-02', frame: 'frame-01' },
  'betashar-romantic': { family: 'luxury', bg: 'bg-marble-01', hero: 'hero-02', divider: 'divider-02', dividerThin: 'divider-03', frame: 'frame-01' },
  'kyz-romantic': { family: 'luxury', bg: 'bg-paper-01', hero: 'hero-01', divider: 'divider-01', dividerThin: 'divider-02', frame: 'frame-01' },
  'birthday-fresh': { family: 'luxury', bg: 'bg-silk-01', hero: 'hero-02', divider: 'divider-03', dividerThin: 'divider-04', frame: 'frame-01' },
  'corporate-elegant': { family: 'luxury', bg: 'bg-marble-01', hero: 'hero-01', divider: 'divider-02', dividerThin: 'divider-03', frame: 'frame-01' },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  skip missing: ${src}`);
    return false;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

/** @param {VariantSpec} spec */
function expandLuxury(slug, spec) {
  const dest = path.join(ROOT, slug);
  const bg = spec.bg ?? 'bg-paper-01';
  const hero = spec.hero ?? 'hero-01';
  const divider = spec.divider ?? 'divider-01';
  const dividerThin = spec.dividerThin ?? 'divider-02';
  const frame = spec.frame ?? 'frame-01';

  const copies = [
    [`backgrounds/${bg}.webp`, `backgrounds/${bg}.webp`],
    [`hero/${hero}.webp`, `hero/${hero}.webp`],
    ['ornaments/corner-01.png', 'ornaments/corner-01.png'],
    ['ornaments/corner-02.png', 'ornaments/corner-02.png'],
    ['ornaments/corner-03.png', 'ornaments/corner-03.png'],
    ['ornaments/corner-04.png', 'ornaments/corner-04.png'],
    [`dividers/${divider}.png`, `dividers/${divider}.png`],
    [`dividers/${dividerThin}.png`, `dividers/${dividerThin}.png`],
    [`ornaments/${frame}.png`, `ornaments/${frame}.png`],
    ['overlays/overlay-grain-01.webp', 'overlays/overlay-grain-01.webp'],
    ['overlays/overlay-vignette-01.webp', 'overlays/overlay-vignette-01.webp'],
  ];

  let copied = 0;
  for (const [relSrc, relDest] of copies) {
    if (copyFile(path.join(LUXURY, relSrc), path.join(dest, relDest))) copied++;
  }

  const heroSrc = path.join(dest, `hero/${hero}.webp`);
  const bgSrc = path.join(dest, `backgrounds/${bg}.webp`);
  if (fs.existsSync(heroSrc)) {
    copyFile(heroSrc, path.join(dest, 'bg-cover.webp'));
    copyFile(heroSrc, path.join(dest, 'hero-cover.webp'));
  }
  if (fs.existsSync(bgSrc)) {
    copyFile(bgSrc, path.join(dest, 'bg-texture.webp'));
  }

  return { dest, heroPath: heroSrc, copied };
}

function expandKazakh(slug) {
  const dest = path.join(ROOT, slug);
  const files = [
    'hero/cover.webp',
    'backgrounds/bg-parchment.webp',
    'ornaments/shanyrak.webp',
    'ornaments/header-band.webp',
  ];
  let copied = 0;
  for (const rel of files) {
    if (copyFile(path.join(KAZAKH, rel), path.join(dest, rel))) copied++;
  }
  const heroPath = path.join(dest, 'hero/cover.webp');
  if (fs.existsSync(heroPath)) {
    copyFile(heroPath, path.join(dest, 'bg-cover.webp'));
  }
  return { dest, heroPath, copied };
}

async function writePreview(heroPath, slug) {
  const previewPath = path.join(ROOT, slug, 'preview.jpg');
  if (!fs.existsSync(heroPath)) {
    console.warn(`  no preview for ${slug}: hero missing`);
    return;
  }
  const buf = await sharp(heroPath)
    .resize(800, 1000, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82 })
    .toBuffer();
  fs.writeFileSync(previewPath, buf);
}

async function main() {
  console.log(`Expanding ${Object.keys(VARIANTS).length} template asset folders...\n`);

  for (const [slug, spec] of Object.entries(VARIANTS)) {
    if (slug === 'wedding-luxury' || slug === 'kyz-traditional') {
      const heroPath =
        slug === 'wedding-luxury'
          ? path.join(LUXURY, 'hero/hero-01.webp')
          : path.join(KAZAKH, 'hero/cover.webp');
      await writePreview(heroPath, slug);
      console.log(`${slug}: source pack (preview only)`);
      continue;
    }

    const result = spec.family === 'kazakh' ? expandKazakh(slug) : expandLuxury(slug, spec);
    await writePreview(result.heroPath, slug);
    console.log(`${slug}: ${result.copied} files copied`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
