/**
 * Subset the self-hosted display faces to the glyphs an invitation can show.
 *
 *   node scripts/subset-fonts.mjs
 *
 * The font library the owner supplied lives outside `public/` on purpose: it
 * is 112MB of .ttf/.otf, and `public/` is served verbatim. Only the handful of
 * faces a template actually uses belongs on the wire, and only as woff2 cut
 * down to the characters a Kazakh or Russian invitation can produce.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import subsetFont from 'subset-font';

// The raw .ttf/.otf library is no longer under public/: 111 MB of source fonts
// were being served from the web root, alongside four font .zip archives and a
// torrent file for a pirated Photoshop build. Only the subset woff2 output
// belongs in public/.
const SRC = 'assets-src/fonts-library';
const OUT = 'public/fonts/web';

// Latin basic, Cyrillic incl. Kazakh, digits, punctuation an invitation uses.
const CHARS = [
  ' !"#$%&\'()*+,-./0123456789:;<=>?@',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`',
  'abcdefghijklmnopqrstuvwxyz{|}~',
  'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
  'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
  'ӘҒҚҢӨҰҮҺІ', 'әғқңөұүһі',
  '«»—–…№₸·•‚„“”‘’',
].join('');

const FACES = [
  ['KZ Oranienbaum.ttf', 'oranienbaum'],
  ['Monolog-Regular.otf', 'monolog-400'],
  ['Monolog-Medium.otf', 'monolog-500'],
  ['KZ Corinthia.ttf', 'corinthia'],
  ['KZ Copperplate.ttf', 'copperplate'],
  ['KZ Andantino_script.ttf', 'andantino'],
  ['Kz_LavanderiaC_kz.ttf', 'lavanderia'],
  ['KZDomainDisplay-Regular.ttf', 'domain'],
  ['CeraRoundPro-Black_kz.otf', 'cera-black'],
  // Added 2026-09-07. The first four are the faces the reference services
  // actually set: Shelley is the script on toi's flagship, Monumenta its
  // display, RomulC the antiqua shaqyru24 sets its values in, Ametist the
  // monogram on their second best seller.
  ['Asylbekm02shelley.Kz.ttf', 'shelley'],
  ['KZPFMonumentaPro-Regular.ttf', 'monumenta'],
  ['KZ RomulC.otf', 'romul'],
  ['Ametist.ttf', 'ametist'],
  ['KZGoodVibes.ttf', 'goodvibes'],
];

mkdirSync(OUT, { recursive: true });
let before = 0, after = 0;

for (const [file, slug] of FACES) {
  const buf = readFileSync(`${SRC}/${file}`);
  const out = await subsetFont(buf, CHARS, { targetFormat: 'woff2' });
  writeFileSync(`${OUT}/${slug}.woff2`, out);
  before += buf.length;
  after += out.length;
  const kb = (n) => Math.round(n / 1024) + 'KB';
  console.log(`${slug.padEnd(14)} ${kb(buf.length).padStart(7)} -> ${kb(out.length).padStart(6)}  ${file}`);
}
console.log(`\ntotal ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
