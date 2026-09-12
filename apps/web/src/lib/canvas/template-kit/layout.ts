/**
 * Turns a skeleton plus a skin into sections.
 *
 * The only place in the catalogue that knows a coordinate, so a spacing bug is
 * fixed once instead of once per template, and two skins are guaranteed the
 * same rhythm even when they share no colour, face or photograph.
 *
 * Type sizes and section heights are measured off toi.com.kz
 * `wedding/template30` at its native 430px width; the compositional devices
 * are measured off the four shaqyru24 cards the owner picked out. Where a
 * comment gives two numbers, the first is theirs.
 *
 * Two rules this file exists to enforce, both of them learned from what the
 * previous version shipped:
 *
 *  1. **Nothing is placed at a fixed offset from the top of a section.** Every
 *     block builds a column of pieces, measures it, and centres it in the
 *     block. Fixed offsets plus a fixed block height put all of the slack at
 *     the bottom, which is how a page ends up 40% empty cream: 300px of air
 *     after the invitation, 330 after the gallery, 450 after the map button.
 *  2. **A component's height is its measured height, not its declared one.**
 *     The calendar was given 227px and renders 297, so the last week of the
 *     month printed on top of the ceremony times. Anything whose height the
 *     renderer decides is listed in `WIDGET` below, measured in a browser.
 */
import type { FontFamily } from '../types';
import type { AnimationConfig } from '../types';
import type { ElementSpec, SectionEntry, SectionResult, TemplateTheme } from './types';
import type { Bilingual, Block, ProgramRow, SkeletonCopy } from './skeleton';
import type { Skin } from './skin';

type Locale = 'kz' | 'ru';
const say = (c: Bilingual, l: Locale) => (l === 'ru' ? c.ru : c.kz);

/**
 * Their measurements, used as-is.
 *
 * Positions are scaled from their 430px column onto our 390px canvas;
 * TYPE is not. Their type is fixed px inside a fluid column, so a 50px name
 * is 50px on every handset. Ours is scaled by viewport/390, so putting their
 * 50 through a 390/430 factor shipped 45px — visibly smaller than the thing
 * it was copied from, which is what "шрифты маленькие" was.
 */
const px = (n: number) => Math.round(n * (390 / 430));
const pt = (n: number) => n;

/** Design width. Percentages in this file are percentages of this. */
const W = 390;

/**
 * The type scale, as a BASE that every skin multiplies.
 *
 * This is the mechanism the reference service uses and the reason its cards
 * differ so much in feel: toi writes every size as
 * `calc(var(--type-scale) * Npx)` and ships `template30` at 1.0 and
 * `template29` at **1.4** — body 20.3, hero names 89.6, calendar figures
 * 22.4, weekday labels 15.4. Two templates, one stylesheet, one number.
 *
 * We had been copying `template30`: the smallest card of the thirty. That is
 * the whole story of "шрифты всё ещё меньше" — not a wrong value, a wrong
 * reference. The base below stays close to theirs at 1.0; a skin that wants
 * presence sets `typeScale` and everything moves together, keeping the gap
 * between the utilitarian band (10-18) and the display band (24-112).
 *
 * One correction is baked into the numbers: our stage is scaled by
 * `viewportWidth / 390`, so a 17px design size renders 16.3 on a 375px
 * handset, while their fixed 17 in a fluid column renders 17. A skin aiming
 * at a real 20px on a small phone has to author about 21.
 */
const BASE_T = {
  eyebrow: pt(12), // ls 2.4, small caps — theirs 10-12
  micro: pt(10), // countdown labels
  small: pt(11), // weekday row, ceremony labels
  day: pt(19), // calendar day numbers — toi/template29 renders 22.4
  form: pt(15), // radio labels, buttons — theirs 16-18
  progTime: pt(18), // programme times
  body: pt(17), // running text — theirs 18-22
  time: pt(24), // ceremony times
  count: pt(30), // countdown figures
  venue: pt(32), // venue name, script
  date: pt(40), // 15.05.2027
  head: pt(38), // section headings, script — theirs 32-36
  headBig: pt(46), // rsvp / wishes headings, script
  name: pt(76), // hero names — toi/template29 renders 89.6
  nameScript: pt(74), // hero/invite names, script — toi/template29 renders 89.6
  monogram: pt(130), // the two initials on the monogram hero — theirs 96
} as const;

/**
 * Heights the renderer decides, measured in a browser on the built page
 * rather than assumed. Every one of these was previously guessed low.
 */
const BASE_WIDGET = {
  /**
   * Six week rows plus the weekday header. Declared 227 and rendered 297 at
   * `T.day = 12`; the rows scale with the figure, so this grew with the scale.
   */
  calendar: 344,
  /** Four cells, figure over label. */
  countdown: 78,
  /**
   * Name field, three options, submit. Measured at 408 once the printed
   * band took a strip off the column and its own labels started wrapping.
   */
  rsvp: 424,
  /**
   * Empty state plus the open-form button. Measured at 344 in the narrower
   * column — the widget prints its own two-line prompt — and it grows again
   * once real wishes exist.
   */
  wishes: 360,
  /** Ceremony pair: figure over a small-caps label. */
  ceremonyRow: 70,
  /** Baseline distance from the ceremony figure down to its label. */
  ceremonyLabel: 38,
  /** Programme row: time and title on one line. */
  programRow: 30,
  /**
   * Measured. The button sizes itself from its own label, so this grew with
   * the scale: 69 at the old type, 105 at the new.
   */
  button: 106,
} as const;

export type TypeScale = { -readonly [K in keyof typeof BASE_T]: number };
type WidgetScale = { -readonly [K in keyof typeof BASE_WIDGET]: number };

/**
 * Widget boxes that grow with the type, and ones that do not.
 *
 * The calendar, the ceremony pair, the programme rows and the countdown are
 * laid out by us from scaled type, so their measured heights move with the
 * scale. `rsvp`, `wishes` and `button` are rendered by components with their
 * own fixed internal sizes, so scaling their boxes would only add air.
 */
const WIDGET_SCALES: ReadonlySet<keyof typeof BASE_WIDGET> = new Set([
  'calendar',
  'countdown',
  'ceremonyRow',
  'ceremonyLabel',
  'programRow',
]);

function scaleTables(typeScale: number): { T: TypeScale; W: WidgetScale } {
  const T = {} as TypeScale;
  for (const key of Object.keys(BASE_T) as Array<keyof typeof BASE_T>) {
    T[key] = Math.round(BASE_T[key] * typeScale);
  }
  const W = {} as WidgetScale;
  for (const key of Object.keys(BASE_WIDGET) as Array<keyof typeof BASE_WIDGET>) {
    W[key] = WIDGET_SCALES.has(key)
      ? Math.round(BASE_WIDGET[key] * typeScale)
      : BASE_WIDGET[key];
  }
  return { T, W };
}

/**
 * Section padding — the only thing that decides how much air a block carries.
 *
 * Their sections run 550-1065px, and the previous version imported those
 * numbers as minimum heights. That works on their card because their content
 * fills them; ours does not, so every block centred a short column inside a
 * tall box and dumped the slack at both ends. Two adjacent blocks then put
 * 300px of empty cream between one sentence and the next — measured on the
 * built page, not guessed. A block is now exactly as tall as what it holds,
 * plus this. 80 is theirs: `.section{padding:76px 26px}`.
 */
const PAD = 80;

/**
 * The opening screen, in design px.
 *
 * NOT a viewport height. The stage is scaled by `viewportWidth / 390`, so
 * 844 design px renders 812 on a 375px handset and 930 on a 430px one; the
 * hero was authored at 844 and its last line therefore fell below the fold on
 * every narrow phone. 780 renders 750 at 375px and clears the shortest
 * handsets in use.
 */
const SCREEN = 780;

/**
 * Clearance at the foot of the opening screen.
 *
 * `PublicPublishWatermark` is `position: fixed; bottom: 12px` — a pill that
 * floats over whatever the viewport happens to be showing. On the hero that
 * is always the same thing, so the freemium badge sat exactly on top of the
 * wedding date on every unpaid invitation.
 */
const WATERMARK = 104;

/**
 * The motion vocabulary, by role.
 *
 * The composer's default is a single `fadeUp` on every element, which is why
 * "everything is animated" still read as homemade: nine sections all arriving
 * with the same 30px nudge. The renderer has carried a wipe, a letter-by-letter
 * arrival and a slow push on a photograph all along — nothing set them.
 *
 * Assigned by what an element *is*, not by where it sits, so the same gesture
 * always means the same thing down the page.
 */
const MOTION = {
  /** Photographs: a long, almost imperceptible push in. */
  photo: { type: 'kenBurns' as const, duration: 9, easing: 'ease-out' as const, once: true },
  /** The couple, and only the couple: assembled letter by letter. */
  names: { type: 'letters' as const, duration: 0.6, easing: 'ease-out' as const, once: true },
  /** Section headings: uncovered by a moving edge, like printing. */
  heading: { type: 'revealUp' as const, duration: 1.1, easing: 'ease-out' as const, once: true },
  /** Small caps lines: they should arrive first and quietly. */
  eyebrow: { type: 'fade' as const, duration: 0.7, easing: 'ease-out' as const, once: true },
  /** Running text, figures, controls. */
  body: { type: 'fadeUp' as const, duration: 0.76, easing: 'ease-out' as const, once: true },
  /** Ornament: fades in slowly, then never stops moving. */
  decor: { type: 'fade' as const, duration: 1.4, easing: 'ease-out' as const, once: true },
};

interface Ctx {
  skin: Skin;
  copy: SkeletonCopy;
  locale: Locale;
  index: number;
  /**
   * How much of the page width a block's column actually gets, 0-1.
   *
   * The printed band takes a strip off one side and `insetSpecs` narrows every
   * box to match — but that happens after layout, so measurement has to know
   * about it up front or every wrapping line is estimated one line short.
   */
  insetK: number;
  /** `BASE_T` multiplied by the skin's `typeScale`. */
  T: TypeScale;
  /** `BASE_WIDGET`, with the type-driven boxes multiplied to match. */
  W: WidgetScale;
}

// ---------------------------------------------------------------------------
// Measuring
// ---------------------------------------------------------------------------

/**
 * Script faces overflow their line box.
 *
 * `Айдар` set in Lavanderia at 52/1.15 asks for a 60px box and paints 76px of
 * ink, so the previous version's fixed offsets put the ampersand inside the
 * descender of the name above it. Scripts get their box inflated instead of
 * every call site guessing a clearance.
 */
const SCRIPT_FACES = new Set<FontFamily>([
  'Lavanderia',
  'Andantino',
  'Corinthia',
  'Shelley',
  'Ametist',
  'GoodVibes',
  'Marck',
  'Great Vibes',
  'Pacifico',
  'Bad Script',
]);

/**
 * Height of a run of text, in px.
 *
 * An estimate, not a measurement — the canvas has no layout engine at build
 * time. It only has to be right enough that the column it feeds never
 * collides, which is why the advance factor is generous and scripts carry a
 * 60% surcharge — measured: Shelley at 89px sits in a 102px auto-height box
 * and paints 135px of ink, and the box is what the flow can see.
 */
function textHeight(
  value: string,
  size: number,
  wPct: number,
  lh: number,
  font: FontFamily,
  ls = 0,
  caps = false,
): number {
  const boxPx = (wPct / 100) * W;
  const advance = size * (caps ? 0.66 : 0.54) + ls;
  const perLine = Math.max(1, Math.floor(boxPx / advance));
  const lines = value
    .split('\n')
    .reduce((n, line) => n + Math.max(1, Math.ceil(line.trim().length / perLine)), 0);
  return Math.ceil(lines * size * lh * (SCRIPT_FACES.has(font) ? 1.6 : 1));
}

// ---------------------------------------------------------------------------
// The column
// ---------------------------------------------------------------------------

/**
 * One entry in a block's vertical column.
 *
 * `after` receives the y the piece landed on, so an element that has to sit
 * beside another one — the hairlines flanking an ampersand, say — can be
 * placed without anybody hard-coding a coordinate twice.
 */
interface Piece {
  spec: ElementSpec;
  h: number;
  /** Space below this piece. Ignored on the last one. */
  gap: number;
  after?: (y: number, h: number) => ElementSpec[];
}

/**
 * Lay a column out and centre it in its block.
 *
 * Returns the block height too: a column taller than the measured height of
 * the reference section grows the section rather than overflowing into the
 * next one.
 */
function column(pieces: Piece[], minHeight = 0, pad = PAD): { specs: ElementSpec[]; height: number } {
  const content = pieces.reduce((sum, p, i) => sum + p.h + (i === pieces.length - 1 ? 0 : p.gap), 0);
  const height = Math.max(minHeight, content + pad * 2);
  let y = Math.round((height - content) / 2);

  const specs: ElementSpec[] = [];
  for (const piece of pieces) {
    piece.spec.props.y = y;
    specs.push(piece.spec);
    if (piece.after) specs.push(...piece.after(y, piece.h));
    y += piece.h + piece.gap;
  }
  return { specs, height };
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

interface TextOpts {
  font: FontFamily;
  size: number;
  color: string;
  ls?: number;
  caps?: boolean;
  lh?: number;
  weight?: 400 | 500 | 600;
  w?: number;
  x?: number;
  align?: 'left' | 'center' | 'right';
  heading?: boolean;
  gap?: number;
  after?: Piece['after'];
  /** Entrance. Defaults to `MOTION.body`; `false` opts out entirely. */
  motion?: false | Partial<AnimationConfig>;
  /**
   * Which wizard field fills this element — and, for the three the envelope
   * screen reads, which line the gate prints.
   *
   * Untagged, the hero's names and date are invisible to both: the filmed
   * gate showed a bare button because nothing in the document claimed to be
   * a name, and the fill-in wizard had nothing to write the couple into.
   */
  placeholderKey?: string;
}

/** A line (or paragraph) of type, measured. */
function text(ctx: Ctx, value: string, o: TextOpts): Piece {
  const w = o.w ?? 72;
  const lh = o.lh ?? 1.4;
  const ls = o.ls ?? 0;
  return {
    // Measured at the width the element ENDS UP with, not the width it was
    // written with. `insetSpecs` narrows every box to clear the printed band
    // after the column has been laid out, so a line that fitted at w:80 could
    // wrap at the w:69 it was actually rendered at — and the flow, having
    // reserved one line, put the next piece through the middle of the second.
    // That is how 15.05.2027 came to sit on top of "басталуы".
    h: textHeight(value, o.size, w * ctx.insetK, lh, o.font, ls, o.caps),
    gap: o.gap ?? 0,
    after: o.after,
    spec: {
      type: o.heading ? 'heading' : 'text',
      animate: o.motion === undefined ? MOTION.body : o.motion,
      props: {
        x: o.x ?? (100 - w) / 2,
        y: 0,
        w,
        h: 'auto',
        text: value,
        fontFamily: o.font,
        fontSize: o.size,
        fontWeight: o.weight ?? 400,
        color: o.color,
        textAlign: o.align ?? 'center',
        lineHeight: lh,
        letterSpacing: ls,
        ...(o.caps ? { uppercase: true } : {}),
        ...(o.placeholderKey ? { placeholderKey: o.placeholderKey } : {}),
      },
    },
  };
}

/** The 10px letterspaced small-caps line that opens every section. */
function eyebrow(ctx: Ctx, copy: Bilingual, gap: number, o: Partial<TextOpts> = {}): Piece {
  return text(ctx, say(copy, ctx.locale), {
    font: ctx.skin.fonts.sans,
    size: ctx.T.eyebrow,
    color: ctx.skin.palette.muted,
    ls: 2.4,
    caps: true,
    weight: 600,
    w: 80,
    gap,
    motion: MOTION.eyebrow,
    ...o,
  });
}

function scriptHead(ctx: Ctx, value: string, size: number, gap: number, o: Partial<TextOpts> = {}): Piece {
  return text(ctx, value, {
    font: ctx.skin.fonts.script,
    size,
    color: ctx.skin.palette.accent,
    lh: 1.15,
    w: 84,
    gap,
    motion: MOTION.heading,
    ...o,
  });
}

/**
 * The ampersand between two names, with the two hairlines that make it read
 * as a joining mark rather than a stray character. Theirs are 54px each,
 * 10px clear of the glyph.
 */
function ampersand(ctx: Ctx, color: string, size: number, gap: number, opacity = 0.55): Piece {
  const rule = (x: number, y: number): ElementSpec => ({
    type: 'shape',
    props: { x, y, w: 14, h: 1, shape: 'rect', fill: color, opacity },
    animate: false,
  });
  return {
    ...text(ctx, '&', {
      font: ctx.skin.fonts.script,
      size,
      color,
      w: 40,
      gap,
    }),
    after: (y, h) => [rule(17, y + Math.round(h / 2)), rule(69, y + Math.round(h / 2))],
  };
}

/** A translucent card with a hairline, like `.detail-card`. */
function cardShape(ctx: Ctx, y: number, h: number): ElementSpec {
  return {
    type: 'shape',
    props: {
      x: 6,
      y,
      w: 88,
      h,
      shape: 'rect',
      fill: ctx.skin.cardFill,
      stroke: ctx.skin.cardStroke,
      strokeWidth: 1,
      radius: 30,
    },
    animate: false,
  };
}

/** The rounded surface a block sits on, when the skin uses panels. */
function panel(ctx: Ctx, height: number): ElementSpec[] {
  const { skin } = ctx;
  if (skin.surface !== 'panel') return [];
  return [
    {
      type: 'shape',
      props: {
        x: skin.panelInset,
        y: px(20),
        w: 100 - skin.panelInset * 2,
        h: height - px(40),
        shape: 'rect',
        fill: skin.palette.panel,
        radius: skin.panelRadius,
        ...(skin.panelBorder ? { stroke: skin.panelBorder, strokeWidth: 1 } : {}),
      },
      animate: false,
    },
  ];
}

// ---------------------------------------------------------------------------
// Decoration
// ---------------------------------------------------------------------------

/**
 * Decoration, at the edges only.
 *
 * The previous table scattered five pieces per section across the whole
 * column at rotations up to 40°, which produced beige ornament floating in
 * the middle of paragraphs — wallpaper, and reviewed as such. toi's 21 pieces
 * are all anchored to a left or right edge and all hang 20-38px past it; the
 * overhang is the whole trick, because a shape cut by the edge of the screen
 * reads as decoration continuing beyond the page while the same shape placed
 * inside the column reads as a sticker.
 *
 * So: edges only, at most three per section, no rotation past a few degrees,
 * and never on a block whose full width is a photograph.
 */
const DECOR: Partial<Record<Block['kind'], Array<[side: -1 | 1, at: number, size: 0 | 1 | 2]>>> = {
  // [which edge, y as a fraction of block height, size index]
  invite: [
    [-1, 0.16, 1],
    [1, 0.78, 2],
  ],
  when: [
    [1, 0.1, 1],
    [-1, 0.62, 2],
  ],
  hosts: [
    [-1, 0.24, 2],
    [1, 0.74, 1],
  ],
  details: [
    [-1, 0.45, 1],
  ],
  rsvp: [
    [1, 0.12, 1],
  ],
  wishes: [
    [-1, 0.2, 1],
  ],
};

const DECOR_SCALE = [0.7, 1, 1.45];

/**
 * The three photographs, three ways.
 *
 * "Сплошные прямоугольные фотки, без интересных обрезок" was about this block
 * as much as about the hero: three identical rectangles in a row is a contact
 * sheet. `strip` is toi's (a band running off the right edge, one and a half
 * frames visible); `stagger` steps them vertically and varies their widths, so
 * the block has a diagonal instead of a baseline; `duo` sets one tall frame
 * against two small ones.
 *
 * Coordinates are `x`/`w` in percent of the page and `y`/`h` in px, relative
 * to the top of the band. Frames may run past either edge — that is the point.
 */
type GalleryFrame = { x: number; y: number; w: number; h: number };

const GALLERY: Record<'strip' | 'stagger' | 'duo', GalleryFrame[]> = {
  strip: [
    { x: 5, y: 0, w: 67, h: 330 },
    { x: 74.6, y: 0, w: 67, h: 330 },
    { x: 144.2, y: 0, w: 67, h: 330 },
  ],
  stagger: [
    { x: -6, y: 0, w: 54, h: 300 },
    { x: 52, y: 64, w: 54, h: 340 },
    { x: 16, y: 424, w: 68, h: 300 },
  ],
  duo: [
    { x: -4, y: 0, w: 58, h: 430 },
    { x: 56, y: 0, w: 48, h: 206 },
    { x: 56, y: 224, w: 48, h: 206 },
  ],
};

function decor(ctx: Ctx, block: Block, height: number): ElementSpec[] {
  const d = ctx.skin.decor;
  const table = DECOR[block.kind];
  if (!d || !table) return [];

  return table.map(([side, at, sizeIdx], n) => {
    const w = d.size * DECOR_SCALE[sizeIdx];
    const hpx = (w / 100) * W;
    // Two thirds on the page, one third past the edge.
    const x = side === -1 ? -w * 0.34 : 100 - w * 0.66;
    return {
      type: 'image' as const,
      props: {
        x,
        y: Math.round(height * at - hpx * 0.5),
        w,
        h: hpx,
        src: d.srcs[(ctx.index + n) % d.srcs.length],
        objectFit: 'contain' as const,
        borderRadius: 0,
        rotation: side === -1 ? -6 : 6,
        tint: d.tints[(ctx.index + n) % d.tints.length],
        // `idle` is the looping half of the motion model and no template had
        // ever set it. A cartouche that drifts a few pixels forever is the
        // difference between ornament and a stamp.
        idle: {
          type: (n % 2 === 0 ? 'float' : 'sway') as 'float' | 'sway',
          duration: 14 + n * 3,
        },
      },
      animate: MOTION.decor,
    };
  });
}

// ---------------------------------------------------------------------------
// Ground: the washed photograph and the printed band
// ---------------------------------------------------------------------------

/** Blocks that are type on a ground, as opposed to full-bleed photography. */
const TEXT_BLOCKS: Array<Block['kind']> = ['invite', 'when', 'hosts', 'details', 'rsvp', 'wishes'];

/**
 * A photograph washed back until it is the ground the type stands on.
 *
 * Answers the single largest visual difference between our pages and theirs.
 * A block of type on flat cream reads as an empty screen no matter how much is
 * written on it; the same block on a photograph under a paper veil reads as a
 * designed spread. toi builds every section of their best cards this way.
 *
 * The veil is a gradient rather than their flat 72%, so each block has a
 * direction — the photograph is present at one edge and gone at the other, and
 * the direction alternates down the page so two neighbours never wash the same
 * way.
 */
function wash(ctx: Ctx, block: Block, height: number): ElementSpec[] {
  const w = ctx.skin.wash;
  const slot = TEXT_BLOCKS.indexOf(block.kind);
  if (!w || !w.srcs.length || slot < 0) return [];
  const src = w.srcs[slot % w.srcs.length];
  const fromTop = slot % 2 === 0;
  return [
    {
      type: 'image',
      props: {
        x: -4,
        y: 0,
        w: 108,
        h: height,
        src,
        objectFit: 'cover',
        borderRadius: 0,
        grade: { saturate: w.saturate, brightness: 104 },
        overlayGradient: {
          from: fromTop ? w.from : w.to,
          to: fromTop ? w.to : w.from,
          angle: 180,
        },
        // A ground does not arrive; it is simply there. An entrance on a
        // full-block photograph reads as the page failing to load.
        parallax: 0.12,
      },
      animate: false,
    },
  ];
}

/**
 * The printed ornament band running down the page.
 *
 * One seamless tile repeated the full height of each block, so the band is
 * continuous across section joins — it is the thing that makes nine stacked
 * blocks read as one printed sheet. Skipped on the opening and closing
 * screens, which are photography edge to edge.
 */
function band(ctx: Ctx, block: Block, height: number, first: boolean, last: boolean): ElementSpec[] {
  const b = ctx.skin.band;
  if (!b || block.kind === 'hero' || block.kind === 'closing') return [];

  const x = b.side === 'left' ? b.inset : 100 - b.inset - b.width;
  const capH = (b.width / 100) * W * 1.6;
  const out: ElementSpec[] = [
    {
      type: 'image',
      props: {
        x,
        y: 0,
        w: b.width,
        h: height,
        src: b.tile,
        objectFit: 'contain',
        borderRadius: 0,
        tile: 'y',
        tint: b.tint,
      },
      animate: false,
    },
  ];
  if (first && b.capTop) {
    out.push({
      type: 'image',
      props: {
        x,
        y: -Math.round(capH * 0.55),
        w: b.width,
        h: capH,
        src: b.capTop,
        objectFit: 'contain',
        borderRadius: 0,
        tint: b.tint,
      },
      animate: false,
    });
  }
  if (last && b.capBottom) {
    out.push({
      type: 'image',
      props: {
        x,
        y: height - Math.round(capH * 0.45),
        w: b.width,
        h: capH,
        src: b.capBottom,
        objectFit: 'contain',
        borderRadius: 0,
        tint: b.tint,
      },
      animate: false,
    });
  }
  return out;
}

/**
 * Squeeze a laid-out column clear of the band.
 *
 * An affine remap of the 0-100 range rather than a flat x offset: shifting
 * every element by the same amount pushes wide ones off the opposite edge,
 * which is how a 80%-wide paragraph ends up 8% past the right margin.
 */
function insetSpecs(specs: ElementSpec[], shift: number, side: 'left' | 'right'): ElementSpec[] {
  if (shift <= 0) return specs;
  const k = 1 - shift / 100;
  const offset = side === 'left' ? shift : 0;
  for (const spec of specs) {
    if (typeof spec.props.x === 'number') spec.props.x = offset + (spec.props.x as number) * k;
    if (typeof spec.props.w === 'number') spec.props.w = (spec.props.w as number) * k;
  }
  return specs;
}

/**
 * A photograph mounted the way a print is mounted in an album: a white margin,
 * a degree or two off square, a real paper corner holding it.
 *
 * Every card in this market crops photographs to a rectangle, an arch or a
 * circle and stops there, so this is the cheapest place to not look like them.
 */
function mountedPrint(
  ctx: Ctx,
  src: string,
  box: { x: number; y: number; w: number; h: number },
  turn: number,
): ElementSpec[] {
  const pr = ctx.skin.print;
  const out: ElementSpec[] = [
    {
      type: 'image',
      props: {
        ...box,
        src,
        objectFit: 'cover',
        borderRadius: 2,
        rotation: turn,
        borderWidth: pr?.border ?? 8,
        borderColor: pr?.borderColor ?? '#FFFFFF',
        shadow: { x: 0, y: 10, blur: 22, color: ctx.skin.photoShadow },
      },
      animate: { ...MOTION.photo, duration: 7 },
    },
  ];
  if (pr?.cornerSrc) {
    const c = 7;
    const cpx = (c / 100) * W;
    // Two corners, diagonally opposite — four reads as a craft-shop border.
    out.push(
      {
        type: 'image',
        props: {
          x: box.x - c * 0.25,
          y: box.y - cpx * 0.25,
          w: c,
          h: cpx,
          src: pr.cornerSrc,
          objectFit: 'contain',
          borderRadius: 0,
          rotation: turn,
        },
        animate: false,
      },
      {
        type: 'image',
        props: {
          x: box.x + box.w - c * 0.75,
          y: box.y + box.h - cpx * 0.75,
          w: c,
          h: cpx,
          src: pr.cornerSrc,
          objectFit: 'contain',
          borderRadius: 0,
          rotation: turn + 180,
        },
        animate: false,
      },
    );
  }
  return out;
}

// ---------------------------------------------------------------------------
// Hero compositions
// ---------------------------------------------------------------------------

/**
 * The opening screen, four ways.
 *
 * This is the frame that gets screenshotted into the WhatsApp group, and it
 * was the same frame on every card: a rectangular photograph bled to both
 * edges with the names centred over its foot. The four here are the four
 * devices the owner pulled off shaqyru24 — a shaped cut under the photograph,
 * a translucent oval over it, type driven into one corner, and a monogram
 * beside a column of photographs. Same content in all four; only the
 * composition moves.
 */
interface HeroResult {
  elements: ElementSpec[];
  height: number;
}

function heroPhoto(ctx: Ctx, props: Record<string, unknown>): ElementSpec {
  return {
    type: 'image',
    props: {
      src: ctx.skin.assets.hero,
      objectFit: 'cover',
      placeholderKey: 'coverPhoto',
      ...props,
    },
    // A still opening screen is what "ни одной анимации" looked like. The push
    // is 9 seconds across 12% of scale — slow enough that you notice the
    // photograph is alive without watching it move.
    animate: MOTION.photo,
  };
}

function heroWave(ctx: Ctx): HeroResult {
  const { skin, copy, locale } = ctx;
  const p = skin.palette;

  const { specs: below, height: colH } = column(
    [
      text(ctx, say(copy.heroKicker, locale), {
        font: skin.fonts.sans,
        size: ctx.T.eyebrow,
        color: p.onPage,
        ls: 3.4,
        caps: true,
        weight: 600,
        w: 80,
        gap: 20,
      }),
      scriptHead(ctx, copy.first, ctx.T.nameScript - 6, 0, { motion: MOTION.names }),
      ampersand(ctx, p.gold, 20, 0, 0.45),
      scriptHead(ctx, copy.second, ctx.T.nameScript - 6, 22, { motion: MOTION.names }),
      text(ctx, say(copy.heroDate, locale), {
        font: skin.fonts.sans,
        size: ctx.T.form,
        color: p.onPage,
        ls: 3.4,
        caps: true,
        weight: 600,
        w: 80,
      }),
    ],
    0,
    26,
  );

  // The photograph takes whatever the type does not, so the date always lands
  // above the fold and above the floating freemium badge.
  const photoH = Math.max(420, SCREEN - WATERMARK - colH);
  for (const spec of below) spec.props.y = (spec.props.y as number) + photoH;

  // The photograph is cut off along a wave and the page ground shows through
  // beneath it, so the names sit on paper rather than on the picture.
  return {
    height: photoH + colH + WATERMARK,
    elements: [
      heroPhoto(ctx, {
        x: -4,
        y: 0,
        w: 108,
        h: photoH + 40,
        borderRadius: 0,
        edgeShape: 'wave',
        overlayGradient: { from: 'rgba(20,14,8,0.16)', to: 'rgba(20,14,8,0.04)', angle: 180 },
      }),
      ...below,
    ],
  };
}

function heroOval(ctx: Ctx): HeroResult {
  const { skin, copy, locale } = ctx;
  const p = skin.palette;
  const height = SCREEN;
  const ovalH = 400;
  // Centred in what is left once the floating badge has its clearance, not in
  // the whole screen.
  const ovalY = Math.round((height - WATERMARK - ovalH) / 2);

  const specs: ElementSpec[] = [
    heroPhoto(ctx, {
      x: -4,
      y: 0,
      w: 108,
      h: height,
      borderRadius: 0,
      overlayGradient: { from: 'rgba(20,14,8,0.30)', to: skin.heroWash, angle: 180 },
    }),
    // A veil, not a plate: the photograph has to stay readable through it.
    {
      type: 'shape',
      props: {
        x: 12,
        y: ovalY,
        w: 76,
        h: ovalH,
        shape: 'circle',
        fill: 'rgba(255,255,255,0.13)',
        stroke: skin.datePillStroke,
        strokeWidth: 1,
      },
      animate: false,
    },
  ];

  const { specs: inside } = column(
    [
      text(ctx, say(copy.heroKicker, locale), {
        font: skin.fonts.sans,
        size: ctx.T.eyebrow,
        color: p.onPhoto,
        ls: 3.4,
        caps: true,
        weight: 600,
        w: 60,
        gap: 22,
      }),
      scriptHead(ctx, copy.first, ctx.T.nameScript - 8, 0, { color: p.onPhoto, w: 62, motion: MOTION.names }),
      ampersand(ctx, p.onPhoto, 20, 0, 0.5),
      scriptHead(ctx, copy.second, ctx.T.nameScript - 8, 24, { color: p.onPhoto, w: 62, motion: MOTION.names }),
      text(ctx, say(copy.heroDate, locale), {
        font: skin.fonts.sans,
        size: ctx.T.form,
        color: p.onPhoto,
        ls: 3.2,
        caps: true,
        weight: 600,
        w: 60,
      }),
    ],
    ovalH,
    0,
  );
  for (const spec of inside) spec.props.y = (spec.props.y as number) + ovalY;
  return { elements: [...specs, ...inside], height };
}

function heroCorner(ctx: Ctx): HeroResult {
  const { skin, copy, locale } = ctx;
  const p = skin.palette;
  const height = SCREEN;

  // Type driven into the bottom-right corner at three different indents, and
  // ragged right rather than centred. Their card does this and it is the one
  // arrangement a centred column can never imitate.
  const specs: ElementSpec[] = [
    heroPhoto(ctx, {
      x: -4,
      y: 0,
      w: 108,
      h: height,
      borderRadius: 0,
      overlayGradient: { from: 'rgba(20,14,8,0.05)', to: skin.heroWash, angle: 155 },
    }),
  ];

  const { specs: block, height: colH } = column(
    [
      text(ctx, say(copy.heroKicker, locale), {
        font: skin.fonts.sans,
        size: ctx.T.eyebrow,
        color: p.onPhoto,
        ls: 3.4,
        caps: true,
        weight: 600,
        w: 60,
        x: 32,
        align: 'right',
        gap: 20,
      }),
      text(ctx, copy.first, {
        font: skin.fonts.heavy,
        size: ctx.T.name - 4,
        color: p.onPhoto,
        lh: 1,
        w: 84,
        x: 8,
        align: 'right',
        weight: 600,
        heading: true,
        gap: 4,
        motion: MOTION.names,
      }),
      text(ctx, copy.second, {
        font: skin.fonts.heavy,
        size: ctx.T.name - 4,
        color: p.onPhoto,
        lh: 1,
        w: 76,
        x: 16,
        align: 'right',
        weight: 600,
        heading: true,
        gap: 26,
        motion: MOTION.names,
      }),
      text(ctx, say(copy.heroDate, locale), {
        font: skin.fonts.sans,
        size: ctx.T.form,
        color: p.onPhoto,
        ls: 3.2,
        caps: true,
        weight: 600,
        w: 50,
        x: 42,
        align: 'right',
      }),
    ],
    0,
    0,
  );
  // Anchored to the foot of the screen, clear of the floating watermark.
  for (const spec of block) spec.props.y = (spec.props.y as number) + height - WATERMARK - colH;
  return { elements: [...specs, ...block], height };
}

function heroMonogram(ctx: Ctx): HeroResult {
  const { skin, copy, locale } = ctx;
  const height = SCREEN;
  const p = skin.palette;
  const stack = [skin.assets.hero, skin.assets.hero2, skin.assets.hero3].filter(Boolean) as string[];

  // Photographs in a column down the right, running off that edge; the type
  // lives on the page ground to the left of them.
  const gap = 14;
  const frameH = Math.round((height - 120 - gap * (stack.length - 1)) / stack.length);
  const specs: ElementSpec[] = stack.map((src, i) => ({
    type: 'image' as const,
    props: {
      x: 46,
      y: 60 + i * (frameH + gap),
      w: 62,
      h: frameH,
      src,
      objectFit: 'cover' as const,
      borderRadius: skin.hero.radius,
      ...(i === 0 ? { placeholderKey: 'coverPhoto' } : {}),
      grade: [{ saturate: 100 }, { saturate: 88, sepia: 6 }, { saturate: 78, brightness: 104 }][i % 3],
      shadow: { x: 0, y: 12, blur: 26, color: skin.photoShadow },
    },
    animate: { type: 'fadeUp' as const, duration: 0.8, delay: 0.1 * i },
  }));

  // The left-hand column is narrow, so the script initials need room for the
  // swash that runs out past the letter's own body; at x:4 it was cut off by
  // the edge of the page.
  const initials = `${copy.first.slice(0, 1)}\n${copy.second.slice(0, 1)}`;
  const { specs: left } = column(
    [
      text(ctx, say(copy.heroKicker, locale), {
        font: skin.fonts.sans,
        size: ctx.T.eyebrow - 1,
        color: p.onPage,
        ls: 2.2,
        caps: true,
        weight: 600,
        w: 40,
        x: 7,
        align: 'left',
        lh: 1.6,
        gap: 26,
      }),
      text(ctx, initials, {
        font: skin.fonts.script,
        size: ctx.T.monogram,
        color: p.gold,
        lh: 1.12,
        w: 40,
        x: 7,
        align: 'left',
        gap: 26,
        motion: MOTION.names,
      }),
      text(ctx, `${copy.first} & ${copy.second}`, {
        font: skin.fonts.sans,
        size: ctx.T.form + 1,
        color: p.onPage,
        ls: 2.6,
        caps: true,
        weight: 600,
        w: 40,
        x: 7,
        align: 'left',
        lh: 1.7,
        gap: 18,
      }),
      text(ctx, say(copy.heroDate, locale), {
        font: skin.fonts.sans,
        size: ctx.T.eyebrow,
        color: p.onPage,
        ls: 2.4,
        caps: true,
        weight: 600,
        w: 40,
        x: 7,
        align: 'left',
      }),
    ],
    height - 160,
    0,
  );
  for (const spec of left) spec.props.y = (spec.props.y as number) + 60;
  return { elements: [...left, ...specs], height };
}

/**
 * The card that came out of the envelope.
 *
 * The photograph does not end on a drawn curve; a photographed torn paper edge
 * is laid across its foot, so what separates picture from page is a real
 * material with fibre and a shadow. Below it the page begins as paper, with
 * the printed band already running.
 *
 * `wave` does the same thing with an SVG clip path, and the difference between
 * the two is the whole argument: one is a shape, the other is a torn sheet.
 */
function heroLetter(ctx: Ctx): HeroResult {
  const { skin, copy, locale } = ctx;
  const p = skin.palette;
  const deckle = skin.assets.paperEdge;
  const height = SCREEN;

  // The names sit ON the photograph, not under it.
  //
  // They were under it for one draft, on paper, which is the nicer idea and
  // does not fit: at the reference service's own name size (89px rendered)
  // the type column alone is 460px, so photograph plus type plus the badge's
  // clearance came to 960 — a third of a screen past the fold, with the fold
  // cutting through the bride's name. toi solves it by giving the hero a fixed
  // 853/1844 box and laying the names over the lower third of the picture, and
  // there is no third option that keeps type this size on one screen.
  const { specs: over, height: colH } = column(
    [
      text(ctx, say(copy.heroKicker, locale), {
        font: skin.fonts.sans,
        size: ctx.T.eyebrow,
        color: p.onPhoto,
        ls: 3.6,
        caps: true,
        weight: 600,
        w: 88,
        gap: 20,
      }),
      scriptHead(ctx, copy.first, ctx.T.nameScript, 0, {
        motion: MOTION.names,
        color: p.onPhoto,
        w: 92,
        placeholderKey: 'groomName',
      }),
      ampersand(ctx, p.onPhoto, Math.round(ctx.T.nameScript * 0.3), 0, 0.5),
      scriptHead(ctx, copy.second, ctx.T.nameScript, 22, {
        motion: MOTION.names,
        color: p.onPhoto,
        w: 92,
        placeholderKey: 'brideName',
      }),
      text(ctx, say(copy.heroDate, locale), {
        font: skin.fonts.display,
        size: ctx.T.form + 3,
        color: p.onPhoto,
        ls: 4,
        caps: true,
        w: 88,
        placeholderKey: 'eventDate',
      }),
    ],
    0,
    0,
  );

  // Anchored to the foot, clear of the floating freemium badge.
  const top = height - WATERMARK - colH;
  for (const spec of over) spec.props.y = (spec.props.y as number) + top;

  // The torn strip closes the picture and opens the paper. A photographed edge
  // rather than a drawn curve: this is the one seam the whole template is
  // named after, and a vector wave has no fibre in it.
  const deckleH = 70;
  const edge: ElementSpec[] = deckle
    ? [
        {
          type: 'image',
          props: {
            x: -6,
            y: height - Math.round(deckleH * 0.62),
            w: 112,
            h: deckleH,
            src: deckle,
            objectFit: 'fill',
            borderRadius: 0,
          },
          animate: false,
        },
      ]
    : [];

  return {
    height,
    elements: [
      heroPhoto(ctx, {
        x: -4,
        y: 0,
        w: 108,
        h: height,
        borderRadius: 0,
        // Dark enough at the foot to carry ivory type, clear at the top.
        overlayGradient: { from: 'rgba(24,18,12,0.06)', to: skin.heroWash, angle: 180 },
      }),
      ...over,
      ...edge,
    ],
  };
}

function hero(ctx: Ctx): SectionResult {
  return {
    wave: heroWave,
    oval: heroOval,
    corner: heroCorner,
    monogram: heroMonogram,
    letter: heroLetter,
  }[ctx.skin.hero.kind](ctx);
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

/** Ceremonies: two columns, figure over a small-caps label. */
function ceremonies(ctx: Ctx, rows: ProgramRow[], gap: number): Piece {
  const { skin } = ctx;
  return {
    h: ctx.W.ceremonyRow,
    gap,
    spec: {
      type: 'text',
      props: {
        x: 14,
        y: 0,
        w: 32,
        h: 'auto',
        text: rows[0] ? rows[0].time : '',
        fontFamily: skin.fonts.display,
        fontSize: ctx.T.time,
        color: skin.palette.ink,
        textAlign: 'center',
        lineHeight: 1.4,
      },
    },
    after: (y) => {
      const out: ElementSpec[] = [];
      rows.forEach((row, i) => {
        const x = i === 0 ? 14 : 54;
        if (i > 0) {
          out.push({
            type: 'text',
            props: {
              x,
              y,
              w: 32,
              h: 'auto',
              text: row.time,
              fontFamily: skin.fonts.display,
              fontSize: ctx.T.time,
              color: skin.palette.ink,
              textAlign: 'center',
              lineHeight: 1.4,
            },
          });
        }
        out.push({
          type: 'text',
          props: {
            x,
            y: y + ctx.W.ceremonyLabel,
            w: 32,
            h: 'auto',
            text: say(row.title, ctx.locale),
            fontFamily: skin.fonts.sans,
            fontSize: ctx.T.small,
            color: skin.palette.muted,
            letterSpacing: 1.1,
            uppercase: true,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.4,
          },
        });
      });
      return out;
    },
  };
}

/** A card: a translucent plate sized to the column it holds. */
function detailCard(ctx: Ctx, pieces: Piece[], gap: number): Piece {
  const inner = 34;
  const content = pieces.reduce((sum, p, i) => sum + p.h + (i === pieces.length - 1 ? 0 : p.gap), 0);
  const h = content + inner * 2;
  return {
    h,
    gap,
    spec: cardShape(ctx, 0, h),
    after: (y) => {
      let cursor = y + inner;
      const out: ElementSpec[] = [];
      for (const piece of pieces) {
        piece.spec.props.y = cursor;
        out.push(piece.spec);
        if (piece.after) out.push(...piece.after(cursor, piece.h));
        cursor += piece.h + piece.gap;
      }
      return out;
    },
  };
}

function build(ctx: Ctx, block: Block): SectionResult {
  const { skin, copy, locale } = ctx;
  const p = skin.palette;
  const f = skin.fonts;

  if (block.kind === 'hero') {
    const result = hero(ctx);
    return { elements: result.elements, height: result.height };
  }

  /* Gallery and closing are full-bleed photography: no panel, no decoration,
     no centred column — they are built by hand. */
  if (block.kind === 'gallery') {
    const head = eyebrow(ctx, copy.galleryEyebrow, 30);
    const plan = GALLERY[skin.gallery.kind];
    const bandH = Math.max(...plan.map((f) => f.y + f.h));
    const height = head.h + head.gap + bandH + PAD * 2;
    const top = Math.round((height - (head.h + head.gap + bandH)) / 2);
    head.spec.props.y = top;

    const srcs = [skin.assets.gallery1, skin.assets.gallery2, skin.assets.gallery3];
    const frames: ElementSpec[] = plan.map((frame, i) => ({
      type: 'image' as const,
      props: {
        x: frame.x,
        y: top + head.h + head.gap + frame.y,
        w: frame.w,
        h: frame.h,
        src: srcs[i],
        objectFit: 'cover' as const,
        borderRadius: skin.gallery.radius,
        ...(skin.gallery.mask === 'none' ? {} : { maskShape: skin.gallery.mask }),
        // Each frame graded a little differently, as theirs are
        // (`saturate(.85) hue-rotate(12deg)` on the second, `.75/-15deg` on
        // the third). Three identical crops read as a contact sheet.
        grade: [{ saturate: 100 }, { saturate: 86, sepia: 8 }, { saturate: 74, brightness: 104 }][i],
        shadow: { x: 0, y: 12, blur: 26, color: skin.photoShadow },
      },
      animate: { ...MOTION.photo, duration: 7, delay: 0.1 * i },
    }));
    return { elements: [head.spec, ...frames], height };
  }

  if (block.kind === 'closing') {
    const height = px(560);
    const line = text(ctx, say(copy.closing, locale), {
      font: f.script,
      size: ctx.T.head,
      color: p.onPhoto,
      w: 84,
      heading: true,
    });
    // Clear of the floating freemium watermark, which is pinned to the foot
    // of the viewport and used to sit straight across this line.
    line.spec.props.y = height - 150;
    return {
      elements: [
        {
          type: 'image',
          props: {
            x: -4,
            y: 0,
            w: 108,
            h: height,
            src: skin.assets.closing,
            objectFit: 'cover',
            borderRadius: 0,
            // The page shuts on the same gesture it opened with: the skin
            // whose hero is cut along a wave gets the cut here too, at the
            // top edge, so the closing photograph rises out of the paper.
            ...(skin.hero.kind === 'wave' ? { maskFade: { top: 6 } } : {}),
            overlayGradient: { from: 'rgba(20,14,8,0.12)', to: 'rgba(20,14,8,0.72)', angle: 180 },
          },
          animate: MOTION.photo,
        },
        line.spec,
      ],
      height,
    };
  }

  let pieces: Piece[] = [];

  switch (block.kind) {
    /* Invite: no photograph at all. */
    case 'invite':
      // The names belong to the opening screen and nowhere else. Setting them
      // again here, in the same script at the same size, made the second
      // screen a near-copy of the first — which is what the block looked like
      // once the hero stopped being a photograph with type over it. On both
      // reference services this screen is a greeting and a sentence.
      pieces = [
        scriptHead(ctx, say(copy.inviteEyebrow, locale), ctx.T.head, 12),
        {
          h: 1,
          gap: 34,
          spec: {
            type: 'shape',
            props: { x: 44, y: 0, w: 12, h: 1, shape: 'rect', fill: p.gold, opacity: 0.6 },
            animate: false,
          },
        },
        text(ctx, say(copy.inviteBody, locale), {
          font: f.sans,
          size: ctx.T.body + 1,
          color: p.ink,
          lh: 1.9,
          w: 78,
        }),
      ];
      break;

    /* When: one screen-and-a-bit carrying date, calendar, ceremonies,
       countdown, venue and the map button. Not four small sections. */
    case 'when':
      pieces = [
        eyebrow(ctx, copy.whenEyebrow, 18),
        text(ctx, copy.dateLine, {
          font: f.display,
          size: ctx.T.date,
          color: p.ink,
          // No tracking and the full column: at the scaled size 15.05.2027 is
          // 10 glyphs of display serif, and a single letterspaced pixel was
          // enough to break the year onto a line of its own.
          ls: 0,
          w: 94,
          heading: true,
          gap: 12,
        }),
        text(ctx, say(copy.startsLabel, locale), {
          font: f.sans,
          size: ctx.T.body,
          color: p.accent,
          ls: 1.7,
          w: 80,
          gap: 6,
        }),
        text(ctx, copy.startsTime, {
          font: f.sans,
          size: ctx.T.body,
          color: p.accent,
          ls: 1.7,
          weight: 600,
          w: 80,
          gap: 30,
        }),
        {
          h: ctx.W.calendar,
          gap: 34,
          spec: {
            type: 'calendar',
            props: {
              x: 10,
              y: 0,
              w: 80,
              h: ctx.W.calendar,
              targetIso: copy.eventIso,
              fontFamily: f.sans,
              fontSize: ctx.T.day,
              color: p.ink,
              accentColor: p.accent,
              markStyle: 'fill',
              showMonthTitle: false,
              showWeekdays: true,
            },
          },
        },
        ceremonies(ctx, copy.ceremonies, 40),
        {
          h: ctx.W.countdown,
          gap: 44,
          spec: {
            type: 'countdown',
            props: {
              x: 8,
              y: 0,
              w: 84,
              h: ctx.W.countdown,
              targetIso: copy.eventIso,
              fontFamily: f.display,
              fontSize: ctx.T.count,
              color: p.ink,
              accentColor: p.muted,
              showLabels: true,
            },
          },
        },
        eyebrow(ctx, copy.venueEyebrow, 16),
        text(ctx, say(copy.venueName, locale), {
          font: f.script,
          size: ctx.T.venue,
          color: p.ink,
          lh: 1.2,
          w: 80,
          gap: 34,
        }),
        {
          h: ctx.W.button,
          gap: 0,
          spec: {
            type: 'button',
            props: {
              // Wide enough for the label at the scaled type: at w:44 the
              // Kazakh "Карта арқылы ашу" broke onto three lines.
              x: 18,
              y: 0,
              w: 64,
              h: ctx.W.button,
              label: say(copy.mapButton, locale),
              action: { kind: 'map' },
              bgColor: p.accent,
              textColor: p.onPhoto,
              fontFamily: f.sans,
              fontSize: ctx.T.form,
              fontWeight: 600,
              borderRadius: skin.pill ? 22 : 4,
              shadow: { x: 0, y: 10, blur: 22, color: skin.photoShadow },
            },
          },
        },
      ];
      break;

    /* Hosts: their card leaves this screen almost empty, and on ours that
       read as an unfinished section rather than as breathing room, because
       there was nothing on it but one line. The rule under the names is what
       makes the emptiness deliberate. */
    case 'hosts': {
      const rule: Piece = {
        h: 26,
        gap: 0,
        spec: skin.decor && skin.decor.rule
          ? {
              type: 'image',
              props: {
                x: 26,
                y: 0,
                w: 48,
                h: 26,
                src: skin.decor.rule,
                objectFit: 'contain',
                borderRadius: 0,
                tint: skin.decor.tints[0],
              },
              animate: false,
            }
          : {
              type: 'shape',
              props: { x: 42, y: 0, w: 16, h: 1, shape: 'rect', fill: p.gold, opacity: 0.7 },
              animate: false,
            },
      };
      pieces = [
        eyebrow(ctx, copy.hostsEyebrow, 22),
        text(ctx, say(copy.hostsName, locale), {
          font: f.heavy,
          size: 37,
          color: p.accent,
          weight: 600,
          lh: 1.08,
          w: 84,
          heading: true,
          gap: 30,
        }),
        rule,
      ];
      break;
    }

    /* Details: dress code and programme in ONE block, each on its own card
       sized to what it holds rather than to a guessed number. */
    case 'details':
      pieces = [
        detailCard(
          ctx,
          [
            scriptHead(ctx, say(copy.dressTitle, locale), ctx.T.head, 26),
            text(ctx, say(copy.dressBody, locale), {
              font: f.sans,
              size: ctx.T.body - 1,
              color: p.ink,
              lh: 1.8,
              w: 74,
            }),
          ],
          56,
        ),
        detailCard(
          ctx,
          [
            scriptHead(ctx, say(copy.programTitle, locale), ctx.T.head, 30),
            ...copy.program.map((row, i) =>
              programRow(ctx, row, i === copy.program.length - 1 ? 0 : 8, i, i === copy.program.length - 1),
            ),
          ],
          0,
        ),
      ];
      break;

    case 'rsvp':
      pieces = [
        eyebrow(ctx, copy.rsvpEyebrow, 14),
        scriptHead(ctx, say(copy.rsvpTitle, locale), ctx.T.headBig, 34),
        {
          h: ctx.W.rsvp,
          gap: 0,
          spec: {
            type: 'rsvp-form',
            props: {
              x: 8,
              y: 0,
              w: 84,
              h: ctx.W.rsvp,
              // The block already carries a heading; the widget's own title
              // made three stacked headings for one form.
              title: '',
              fontFamily: f.sans,
              bgColor: 'transparent',
              textColor: p.ink,
              accentColor: p.accent,
              askPlusOne: true,
              askPhone: false,
              askDietary: false,
              askChildren: false,
            },
          },
        },
      ];
      break;

    /* The wishes widget prints its own "leave the couple a warm wish" line,
       so the block's own copy of that sentence appeared directly above it,
       twice, in slightly different words. */
    case 'wishes':
      pieces = [
        eyebrow(ctx, copy.wishesEyebrow, 14),
        scriptHead(ctx, say(copy.wishesTitle, locale), ctx.T.headBig, 30),
        {
          h: ctx.W.wishes,
          gap: 0,
          spec: {
            type: 'wishes',
            props: {
              x: 8,
              y: 0,
              w: 84,
              h: ctx.W.wishes,
              title: '',
              fontFamily: f.sans,
              bgColor: 'transparent',
              textColor: p.ink,
              accentColor: p.accent,
              reactions: ['❤️', '🙏', '🥂', '👏'],
              allowAnonymous: true,
            },
          },
        },
      ];
      break;
  }

  const { specs, height } = column(pieces);

  // A mounted print hung off the outer edge of the three thinnest blocks.
  //
  // These are the screens that read as empty however much is written on them —
  // an eyebrow, a heading and a paragraph is not a spread — and they are also
  // the only places on the page where an object can hang past the margin
  // without colliding with anything. One print each, alternating sides,
  // turned a couple of degrees so it reads as placed rather than as laid out.
  const prints: Partial<Record<Block['kind'], { src?: string; x: number; turn: number }>> = {
    invite: { src: skin.assets.print1, x: 58, turn: -3 },
    hosts: { src: skin.assets.print2, x: 10, turn: 2.5 },
    rsvp: { src: skin.assets.print3, x: 60, turn: 3 },
  };
  const mounted: ElementSpec[] = [];
  const slot = prints[block.kind];
  let blockH = height;
  if (slot?.src && skin.print) {
    const pw = 36;
    const ph = Math.round((pw / 100) * W * 1.3);
    // The print gets its own band under the column rather than being dropped
    // on top of it. Placed by fraction of the block it landed across the
    // paragraph, because a block is exactly as tall as its text and there is
    // no spare middle to hang anything in.
    blockH = height + ph + 56;
    mounted.push(
      ...mountedPrint(ctx, slot.src, { x: slot.x, y: height + 12, w: pw, h: ph }, slot.turn),
    );
  }

  // Clear of the printed band, if the skin has one. Done after layout rather
  // than by narrowing every helper: the column does not need to know the band
  // exists, and one affine remap is harder to get wrong than twenty widths.
  insetSpecs(specs, bandShift(skin), skin.band ? skin.band.side : 'left');

  // Ornament goes UNDER the panel, not over it. The composer hands out
  // z-order by position in this array, so decoration listed last was drawn on
  // top of the ivory cards — half a cartouche on the page ground and half
  // stamped across the card's rounded corner, which reads as a smudge rather
  // than as something bleeding out from behind the card.
  return {
    elements: [
      ...wash(ctx, block, blockH),
      ...decor(ctx, block, blockH),
      ...panel(ctx, blockH),
      ...band(ctx, block, blockH, block.kind === 'invite', block.kind === 'wishes'),
      ...mounted,
      ...specs,
    ],
    height: blockH,
  };
}

/**
 * One line of the programme.
 *
 * Two shapes, chosen by whether the skin ships pictograms.
 *
 * Without them: a figure and a title, which is what every card in this market
 * does and what we did.
 *
 * With them: a photographed object, a hairline running the height of the row,
 * and the time over its label — so the programme reads as an evening laid out
 * along a thread rather than as a two-column table. The hairline is drawn per
 * row and butts against its neighbours, which keeps it continuous without
 * anybody having to know the height of the whole list.
 */
function programRow(ctx: Ctx, row: ProgramRow, gap: number, index: number, last: boolean): Piece {
  const { skin } = ctx;
  const icons = skin.assets.icons;
  const icon = icons && icons.length ? icons[index % icons.length] : undefined;

  const rowH = Math.round(Math.max(ctx.W.programRow * 2.2, 74));
  const iconW = 15;
  const iconPx = (iconW / 100) * W;
  // With a pictogram the thread runs beside it; without one it runs down the
  // left margin and the row starts where the pictogram would have ended.
  const threadX = icon ? 31 : 14;
  const textX = icon ? 38 : 21;

  const head: ElementSpec = icon
    ? {
        type: 'image',
        props: {
          x: 10,
          y: Math.round((rowH - iconPx) / 2),
          w: iconW,
          h: iconPx,
          src: icon,
          objectFit: 'contain',
          borderRadius: 0,
        },
        animate: MOTION.body,
      }
    : {
        // The node on the thread: a small filled dot at the row's own time.
        type: 'shape',
        props: {
          x: threadX - 0.9,
          y: Math.round(rowH / 2) - 3,
          w: 2.2,
          h: 8,
          shape: 'circle',
          fill: skin.palette.accent,
        },
        animate: MOTION.body,
      };

  return {
    h: rowH,
    gap,
    spec: head,
    after: (y) => [
      // The thread. Runs the full row and stops halfway down the last one, so
      // the list ends rather than trailing off.
      {
        type: 'shape',
        props: {
          x: threadX,
          y,
          w: 0.4,
          h: last ? Math.round(rowH * 0.5) : rowH,
          shape: 'rect',
          fill: skin.palette.gold,
          opacity: 0.45,
        },
        animate: false,
      },
      {
        type: 'text',
        props: {
          x: textX,
          y: y + Math.round(rowH / 2) - Math.round(ctx.T.progTime * 1.05),
          w: 62,
          h: 'auto',
          text: row.time,
          fontFamily: skin.fonts.display,
          fontSize: ctx.T.progTime + 4,
          color: skin.palette.ink,
          textAlign: 'left',
          lineHeight: 1.2,
        },
        animate: MOTION.body,
      },
      {
        type: 'text',
        props: {
          x: textX,
          y: y + Math.round(rowH / 2) + 4,
          w: 62,
          h: 'auto',
          text: say(row.title, ctx.locale),
          fontFamily: skin.fonts.sans,
          fontSize: ctx.T.small,
          letterSpacing: 1.6,
          uppercase: true,
          fontWeight: 600,
          color: skin.palette.muted,
          textAlign: 'left',
          lineHeight: 1.4,
        },
        animate: MOTION.body,
      },
    ],
  };
}

// ---------------------------------------------------------------------------

export function skinToTheme(skin: Skin): TemplateTheme {
  return {
    paper: skin.palette.page,
    ink: skin.palette.ink,
    accent: skin.palette.accent,
    muted: skin.palette.muted,
    onPhoto: skin.palette.onPhoto,
    accentDeep: skin.palette.gold,
    display: skin.fonts.sans,
    body: skin.fonts.sans,
    script: skin.fonts.script,
  };
}

/** The strip the printed band takes out of the page, in percent. */
function bandShift(skin: Skin): number {
  return skin.band ? skin.band.inset + skin.band.width + 4 : 0;
}

export function skeletonSections(skeleton: Block[], copy: SkeletonCopy, skin: Skin): SectionEntry[] {
  const { T, W } = scaleTables(skin.typeScale ?? 1);
  const insetK = 1 - bandShift(skin) / 100;
  return skeleton.map((block, index) => ({
    key: block.kind,
    build: (sectionCtx) =>
      build({ skin, copy, locale: sectionCtx.locale, index, T, W, insetK }, block),
  }));
}
