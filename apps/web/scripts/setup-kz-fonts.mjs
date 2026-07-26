#!/usr/bin/env node
/**
 * Download self-hosted KZ invitation fonts (OFL) with cyrillic-ext subsets.
 * Usage: node scripts/setup-kz-fonts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'fonts');

/** @type {Array<{ file: string; url: string }>} */
const FONTS = [
  {
    file: 'cormorant-cyrillic-ext.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@5.2.5/cyrillic-ext-400-normal.woff2',
  },
  {
    file: 'cormorant-cyrillic.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@5.2.5/cyrillic-400-normal.woff2',
  },
  {
    file: 'cormorant-latin.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@5.2.5/latin-400-normal.woff2',
  },
  {
    file: 'cormorant-600-cyrillic-ext.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@5.2.5/cyrillic-ext-600-normal.woff2',
  },
  {
    file: 'cormorant-600-cyrillic.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@5.2.5/cyrillic-600-normal.woff2',
  },
  {
    file: 'montserrat-cyrillic-ext.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.2.5/cyrillic-ext-600-normal.woff2',
  },
  {
    file: 'montserrat-cyrillic.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.2.5/cyrillic-600-normal.woff2',
  },
  {
    file: 'montserrat-latin.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.2.5/latin-600-normal.woff2',
  },
  {
    file: 'marck-script-cyrillic.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/marck-script@5.2.5/cyrillic-400-normal.woff2',
  },
  {
    file: 'marck-script-latin.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/marck-script@5.2.5/latin-400-normal.woff2',
  },
  {
    file: 'unbounded-cyrillic-ext.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/unbounded@5.2.5/cyrillic-ext-600-normal.woff2',
  },
  {
    file: 'unbounded-cyrillic.woff2',
    url: 'https://cdn.jsdelivr.net/fontsource/fonts/unbounded@5.2.5/cyrillic-600-normal.woff2',
  },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log('Downloading KZ fonts →', OUT);

  for (const { file, url } of FONTS) {
    const dest = path.join(OUT, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log('  skip', file);
      continue;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log('  wrote', file, `(${buf.length} bytes)`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
