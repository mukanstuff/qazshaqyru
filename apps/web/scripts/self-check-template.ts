/**
 * Run a built template against the numeric thresholds in
 * `docs/template-self-check.md`.
 *
 *   npx tsx scripts/self-check-template.ts inju
 *
 * Every threshold here is a percentile or a median measured off the two
 * reference services (see `docs/design-vocabulary.md`); none is a preference.
 * The point of the script is that "it looks finished" is not a check — a
 * template can carry every device in the vocabulary and still fail on the one
 * that was quietly dropped during layout fixes, which is exactly what happened
 * to this one twice before it passed.
 *
 * Reads the composed document out of the database, so it checks what actually
 * shipped rather than re-deriving it from the recipe.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

type El = Record<string, any>;

const CANVAS = 100; // element x/w are percentages of the design width

function pct(el: El) {
  const w = typeof el.w === 'number' ? el.w : 0;
  return { left: el.x, right: el.x + w, centre: el.x + w / 2, w };
}

function line(id: string, label: string, need: string, got: string, ok: boolean) {
  const mark = ok ? 'OK  ' : 'FAIL';
  console.log(`${mark} ${id.padEnd(4)} ${label.padEnd(34)} need ${need.padEnd(34)} got ${got}`);
  return ok;
}

async function checkOne(tpl: { slug: string; canvas: unknown }): Promise<boolean> {
  const slug = tpl.slug;
  const doc = tpl.canvas as any;
  const els: El[] = doc.elements;
  const width: number = doc.width;
  const images = els.filter((e) => e.type === 'image');
  const texts = els.filter((e) => e.type === 'text' || e.type === 'heading');
  const shapes = els.filter((e) => e.type === 'shape');
  const px = (p: number) => Math.round((p / 100) * width);

  let pass = true;
  const check = (...a: Parameters<typeof line>) => { pass = line(...a) && pass; };

  console.log(`\n${slug} — ${els.length} elements, ${doc.height}px at ${width}px wide\n`);

  // C1 — bleed
  const bleeding = els.filter((e) => { const p = pct(e); return p.left < -1 || p.right > CANVAS + 1; });
  const fullBleed = images.filter((e) => pct(e).w >= CANVAS - 1);
  const maxOver = Math.max(0, ...bleeding.map((e) => { const p = pct(e); return Math.max(-p.left, p.right - CANVAS); }));
  const widerShare = Math.round((images.filter((e) => pct(e).w > CANVAS).length / images.length) * 100);
  check('C1', 'bleed past the page edge', '>=4 elements', `${bleeding.length}`, bleeding.length >= 4);
  check('C1', 'full-bleed image', '>=1', `${fullBleed.length}`, fullBleed.length >= 1);
  check('C1', 'largest overflow', '>=28px', `${px(maxOver)}px`, px(maxOver) >= 28);
  check('C1', 'images wider than canvas', '20-40%', `${widerShare}%`, widerShare >= 20 && widerShare <= 40);

  // C2 — a non-rectangular photo silhouette
  const masked = images.filter((e) => e.maskShape && e.maskShape !== 'rect');
  const faded = images.filter((e) => e.maskFade);
  const edged = images.filter((e) => e.edgeShape);
  const arch = images.filter((e) => e.maskShape === 'arch');
  check('C2', 'non-rectangular photo mask', '>=1', `arch ${arch.length}, fade ${faded.length}, edge ${edged.length}`,
    masked.length + faded.length + edged.length >= 1);

  // C3 — one asset re-used with real variation
  const bySrc = new Map<string, El[]>();
  images.forEach((e) => { if (e.src) bySrc.set(e.src, [...(bySrc.get(e.src) ?? []), e]); });
  const reuse = [...bySrc.entries()].map(([src, list]) => ({ src, n: list.length, list }));
  const top = reuse.sort((a, b) => b.n - a.n)[0];
  const variants = top ? new Set(top.list.map((e) => `${Math.round(e.w)}|${e.rotation}`)).size : 0;
  const ratio = images.length / bySrc.size;
  check('C3', 'most-used file', '>=3 insertions', `${top?.n ?? 0}`, (top?.n ?? 0) >= 3);
  check('C3', 'its distinct transforms', '>=2', `${variants}`, variants >= 2);
  check('C3', 'insertions per unique file', '>=1.33', ratio.toFixed(2), ratio >= 1.33);
  check('C3', 'unique image files', '<=11', `${bySrc.size}`, bySrc.size <= 11);

  // C4 — a broken type scale
  const sizes = [...new Set(texts.map((e) => e.fontSize).filter(Boolean))].sort((a, b) => a - b);
  const span = sizes.length ? sizes[sizes.length - 1] / sizes[0] : 0;
  let jump = 0;
  for (let i = 1; i < sizes.length; i++) jump = Math.max(jump, sizes[i] / sizes[i - 1]);
  // Thresholds are authored at the reference width of 430; scale to ours.
  const k = width / 430;
  check('C4', 'max/min size', '>=3.0x', `${span.toFixed(2)}x`, span >= 3);
  check('C4', 'largest single step', '>=1.5x', `${jump.toFixed(2)}x`, jump >= 1.5);
  check('C4', 'distinct sizes', '5-9', `${sizes.length} (${sizes.join('/')})`, sizes.length >= 5 && sizes.length <= 9);
  check('C4', 'smallest size', `>=${(16 * k).toFixed(0)}px`, `${sizes[0]}px`, sizes[0] >= 16 * k);
  check('C4', 'largest size', `>=${(52 * k).toFixed(0)}px`, `${sizes[sizes.length - 1]}px`, sizes[sizes.length - 1] >= 52 * k);

  // C5 — off the centre line
  const offAxis = els.filter((e) => Math.abs(pct(e).centre - 50) > 3);
  const textShift = Math.max(0, ...texts.map((e) => Math.abs(pct(e).centre - 50)));
  const anchors = [...new Set(els.filter((e) => pct(e).left >= 0 && pct(e).right <= CANVAS)
    .map((e) => Math.round(pct(e).centre)))].sort((a, b) => a - b);
  check('C5', 'components off the axis', '>=5', `${offAxis.length}`, offAxis.length >= 5);
  check('C5', 'largest text shift', `>=${px(70 / 430 * 100)}px`, `${px(textShift)}px`, px(textShift) >= (70 / 430) * width);
  check('C5', 'content anchors', '3-4', `${anchors.length} (${anchors.join('/')})`, anchors.length >= 3 && anchors.length <= 4);

  // C6 — a panel under text, wider than the text
  const panels = shapes.filter((e) => (e.fill && e.fill !== 'transparent') || (e.stroke && e.strokeWidth));
  let widest = 0;
  for (const p of panels) {
    const inside = texts.filter((t2) => t2.y >= p.y - 40 && t2.y <= p.y + (typeof p.h === 'number' ? p.h : 0));
    for (const t2 of inside) widest = Math.max(widest, pct(p).w - pct(t2).w);
  }
  check('C6', 'panels under text', '>=1', `${panels.length}`, panels.length >= 1);
  check('C6', 'panel wider than its text', '>=40px', `${px(widest)}px`, px(widest) >= 40);

  // C7 — the canonical order
  const order = [...new Set(els.map((e) => String(e.id).replace(/-\d+$/, '')))];
  const canonical = ['hero', 'greeting', 'hosts', 'when', 'location', 'rsvp'];
  const seen = canonical.filter((c) => order.includes(c));
  const inOrder = seen.every((c, i) => i === 0 || order.indexOf(seen[i - 1]) < order.indexOf(c));
  check('C7', 'canonical roles present', '>=6 of 8', `${seen.length + (order.includes('collage') ? 1 : 0) + (order.includes('wishes') ? 1 : 0)}`,
    seen.length + (order.includes('collage') ? 1 : 0) + (order.includes('wishes') ? 1 : 0) >= 6);
  check('C7', 'no order inversions', '0', inOrder ? '0' : 'yes', inOrder);
  // `music` is a pinned overlay, not a page section, so it does not count
  //  toward position — the reference floats the same two buttons.
  const sections = order.filter((k) => k !== 'music');
  check('C7', 'rsvp last or next to last', 'within last 3', `${sections.indexOf('rsvp') + 1}/${sections.length}`, sections.indexOf('rsvp') >= sections.length - 3);

  // C8 — volume, scaled from the reference width
  const hLo = 3900 * k, hHi = 6300 * k;
  check('C8', 'document height', `${Math.round(hLo)}-${Math.round(hHi)}px`, `${doc.height}px`, doc.height >= hLo && doc.height <= hHi);
  check('C8', 'elements', '26-56', `${els.length}`, els.length >= 26 && els.length <= 56);
  check('C8', 'text blocks', '12-22', `${texts.length}`, texts.length >= 12 && texts.length <= 22);

  // C11 — text sitting on photography
  let over = 0;
  for (const t2 of texts) {
    const ty = t2.y, tb = t2.y + 40;
    if (images.some((im) => {
      const ih = typeof im.h === 'number' ? im.h : 0;
      const vo = Math.min(tb, im.y + ih) - Math.max(ty, im.y);
      const p1 = pct(t2), p2 = pct(im);
      const ho = Math.min(p1.right, p2.right) - Math.max(p1.left, p2.left);
      return vo > 0 && ho > 10 && t2.zIndex > im.zIndex;
    })) over += 1;
  }
  check('C11', 'text over photography', '>=6', `${over}`, over >= 6);

  // C12 — cut-out ornaments really carry alpha
  const dir = join(process.cwd(), 'public', 'assets', 'templates', slug);
  const orn = [...bySrc.keys()].filter((s) => /oyu-/.test(s));
  let withAlpha = 0;
  for (const s of orn) {
    const f = join(dir, s.split('/').pop() as string);
    if (!existsSync(f)) continue;
    const b = readFileSync(f);
    if (b.slice(0, 4).toString('latin1') === '\x89PNG' && (b[25] === 6 || b[25] === 4)) withAlpha += 1;
  }
  check('C12', 'ornaments with alpha', '>=50%', orn.length ? `${Math.round((withAlpha / orn.length) * 100)}%` : 'n/a',
    orn.length > 0 && withAlpha / orn.length >= 0.5);

  // C13 — palette size
  const colours = new Set<string>();
  els.forEach((e) => ['color', 'fill', 'stroke', 'tint', 'bgColor', 'textColor', 'accentColor'].forEach((key) => {
    const v = e[key];
    if (typeof v === 'string' && /^#/.test(v)) colours.add(v.toUpperCase());
  }));
  check('C13', 'unique colours', '<=11', `${colours.size}`, colours.size <= 11);

  // Motion — not in the original list, but the register document measures it
  const animated = els.filter((e) => e.animation && e.animation.type !== 'none');
  const idle = els.filter((e) => e.idle);
  const share = Math.round((animated.length / els.length) * 100);
  const durs = animated.map((e) => e.animation.duration).sort((a, b) => a - b);
  const medDur = durs[Math.floor(durs.length / 2)];
  check('C15', 'animated share', '38-89%', `${share}%`, share >= 38 && share <= 89);
  check('C15', 'median entrance', '>=1.6s', `${medDur}s`, medDur >= 1.6);
  check('C15', 'looping ornament', '>=1', `${idle.length}`, idle.length >= 1);

  console.log(`\n${pass ? 'PASS' : 'FAIL'} — ${slug}\n`);
  return pass;
}

/**
 * With no slug, every canvas template in the catalogue is checked.
 *
 * The thresholds are the catalogue standard, not one template's homework, so a
 * regression in something already shipped should be as loud as a failure in the
 * template being written. The older templates predate the gate and will fail —
 * that is the backlog, not a broken script.
 */
async function main() {
  const slug = process.argv[2];
  const prisma = new PrismaClient();
  const rows = slug
    ? await prisma.template.findMany({ where: { slug } })
    : await prisma.template.findMany({
        // Hidden QA fixtures are not part of the catalogue standard.
        where: { isCanvasTemplate: true, isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
  await prisma.$disconnect();

  if (!rows.length) throw new Error(slug ? `no template ${slug}` : 'no canvas templates');

  const results: Array<[string, boolean]> = [];
  for (const row of rows) {
    results.push([row.slug, await checkOne(row as { slug: string; canvas: unknown })]);
  }

  if (results.length > 1) {
    console.log('summary');
    for (const [s, ok] of results) console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${s}`);
  }
  if (results.some(([, ok]) => !ok)) process.exitCode = 1;
}

main();
