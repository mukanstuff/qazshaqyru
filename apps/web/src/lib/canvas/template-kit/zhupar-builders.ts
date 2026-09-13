/**
 * Sections for «Жұпар» — үйлену тойы.
 *
 * The fourth template built on the measured skeleton, and the brief was to
 * change small things rather than big ones. What stays is everything that
 * passes the gate in «Сәукеле» and «Тақия». What is new, each one lifted from
 * the reference set rather than invented:
 *
 *  - a programme of the day with icons on a rail (toi, 3 of its 4 newest
 *    wedding cards);
 *  - the greeting plate rides up over the foot of the hero (toi template 27);
 *  - quarter-medallion corners on opposite corners, not a left-right pair;
 *  - two hairline rings round the oval photograph;
 *  - a heart that beats on the calendar day (shaqyru24);
 *  - a dress code with colour swatches (toi template 27);
 *  - a signature under the closing line (toi template 27).
 *
 * The whole ornament kit is one generated medallion. The band is one of its
 * lobes plus its centre rhombus, repeated; the corner is its quarter, cut
 * through the centre so the cut lies along an edge. Two further rounds of
 * separately generated corners and bands came back as baroque scrolls and
 * literal ram heads.
 *
 * Anchors. The gate allows three or four content centres; the music dial
 * already takes 84. Everything here therefore sits on 33, 50 or 67 — the
 * swatches, the hosts block and the oval included — and the two plates run
 * edge to edge, so their quarter corners bleed and do not add a fifth.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };
const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

const A = {
  heroVideo: '/assets/templates/zhupar/hero.webm',
  heroPoster: '/assets/templates/zhupar/hero-poster.webp',
  rings: '/assets/templates/zhupar/story-rings.webp',
  table: '/assets/templates/zhupar/story-table.webp',
  medallion: '/assets/templates/zhupar/oyu-medallion.png',
  band: '/assets/templates/zhupar/oyu-band-tile.png',
  corner: '/assets/templates/zhupar/oyu-corner.png',
  iconKese: '/assets/templates/zhupar/oyu-icon-kese.png',
  iconSaukele: '/assets/templates/zhupar/oyu-icon-saukele.png',
  iconDombra: '/assets/templates/zhupar/oyu-icon-dombra.png',
  iconTort: '/assets/templates/zhupar/oyu-icon-tort.png',
} as const;

/**
 * 15 / 18 / 22 / 27 / 42 / 50: top to bottom 3.3x, largest step 1.56x between
 * `lead` and `head`. The signature reuses `head` rather than adding a size: a
 * seventh size between 27 and 42 splits the one big step into two small ones
 * and the scale stops reading as a scale.
 */
const T = {
  cap: 15,
  small: 18,
  body: 22,
  lead: 27,
  head: 42,
  name: 50,
} as const;

/** The three content centres, see the header. */
const AX = { left: 33, mid: 50, right: 67 } as const;

const HEAD_LINE = 50;

const gold = (ctx: SectionContext) => ctx.theme.accentDeep ?? ctx.theme.accent;

const GLOW = { x: 0, y: 2, blur: 9, color: 'rgba(255,255,255,0.8)' } as const;
const GLOW_TIGHT = { x: 0, y: 1, blur: 4, color: 'rgba(255,255,255,0.95)' } as const;

/** How far the greeting plate rides up over the hero. */
const OVERLAP = 56;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function cap(
  ctx: SectionContext,
  copy: Copy,
  y: number,
  opts: { color?: string; onPhoto?: boolean; size?: number; x?: number; w?: number; align?: 'left' | 'center' } = {},
): ElementSpec {
  return {
    type: 'text',
    props: {
      x: opts.x ?? 10,
      y,
      w: opts.w ?? 80,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Cormorant',
      fontSize: opts.size ?? T.cap,
      fontWeight: 600,
      color: opts.color ?? ctx.theme.muted,
      textAlign: opts.align ?? 'center',
      lineHeight: 1.4,
      letterSpacing: 3.4,
      ...(opts.onPhoto ? { textShadow: GLOW_TIGHT } : {}),
    },
    animate: { type: 'fade', duration: 2.4 },
  };
}

function head(ctx: SectionContext, copy: Copy, y: number): ElementSpec {
  return {
    type: 'text',
    props: {
      x: 8,
      y,
      w: 84,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Cormorant',
      fontSize: T.head,
      fontWeight: 500,
      color: ctx.theme.ink,
      textAlign: 'center',
      lineHeight: 1.18,
      letterSpacing: 0.3,
    },
    animate: { type: 'slideLeft', duration: 2.7 },
  };
}

function body(ctx: SectionContext, copy: Copy, y: number, w = 72, size: number = T.body): ElementSpec {
  return {
    type: 'text',
    props: {
      x: (100 - w) / 2,
      y,
      w,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Monolog',
      fontSize: size,
      fontWeight: 400,
      color: ctx.theme.ink,
      textAlign: 'center',
      lineHeight: 1.72,
      letterSpacing: 0,
    },
    animate: { type: 'slideRight', duration: 2.6 },
  };
}

function medallion(
  ctx: SectionContext,
  y: number,
  opts: { x: number; w: number; rotation?: number; opacity?: number; spin?: boolean },
): ElementSpec {
  return {
    type: 'image',
    props: {
      x: opts.x,
      y,
      w: opts.w,
      h: Math.round((opts.w / 100) * 390),
      src: A.medallion,
      alt: '',
      objectFit: 'contain',
      borderRadius: 0,
      tint: gold(ctx),
      rotation: opts.rotation ?? 0,
      ...(opts.opacity !== undefined ? { opacity: opts.opacity } : {}),
      ...(opts.spin ? { idle: { type: 'spin', duration: 30 } } : {}),
    },
    animate: { type: 'fade', duration: 2.0 },
  };
}

/** The band: one lobe of the medallion and its rhombus, repeated along x. */
function band(ctx: SectionContext, y: number): ElementSpec {
  return {
    type: 'image',
    props: {
      x: -9,
      y,
      w: 118,
      h: 40,
      src: A.band,
      alt: '',
      objectFit: 'contain',
      borderRadius: 0,
      tint: gold(ctx),
      tile: 'x',
      opacity: 0.9,
    },
    animate: { type: 'fade', duration: 2.2 },
  };
}

/**
 * A quarter of the medallion in a corner.
 *
 * The file is the medallion's lower-right quadrant, so its cut edges are its
 * top and left. `top-left` puts those edges on the plate's top and left edge;
 * `bottom-right` turns it half round. It hangs 1% past the page so the gate
 * counts it as bleed rather than as a content centre.
 */
function quarter(ctx: SectionContext, y: number, corner: 'top-left' | 'bottom-right', w = 20): ElementSpec {
  return {
    type: 'image',
    props: {
      x: corner === 'top-left' ? -1 : 101 - w,
      y,
      w,
      h: Math.round((w / 100) * 390),
      src: A.corner,
      alt: '',
      objectFit: 'contain',
      borderRadius: 0,
      tint: gold(ctx),
      rotation: corner === 'top-left' ? 0 : 180,
      opacity: 0.6,
    },
    animate: false,
  };
}

/** A translucent plate, edge to edge. */
function plate(ctx: SectionContext, y: number, h: number): ElementSpec {
  return {
    type: 'shape',
    props: {
      x: -1,
      y,
      w: 102,
      h,
      shape: 'rect',
      fill: 'rgba(255,255,255,0.72)',
      radius: 0,
      stroke: 'transparent',
      strokeWidth: 0,
      shadow: { x: 0, y: 10, blur: 28, color: 'rgba(47,59,47,0.08)' },
    },
    animate: false,
  };
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------

export function zhuparHero(options: { names?: string } = {}): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: -5,
          y: 0,
          w: 110,
          h: 720,
          src: A.heroPoster,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskFade: { bottom: 18 },
        },
        animate: { type: 'fade', duration: 2.0 },
      },
      {
        type: 'video-bg',
        props: {
          x: -5,
          y: 0,
          w: 110,
          h: 720,
          src: A.heroVideo,
          posterSrc: A.heroPoster,
          loop: true,
          opacity: 1,
          maskFade: { bottom: 18 },
        },
      },
      /*
       * Measured before it was placed: `measure-frame.mjs` on the clip's first
       * frame, drawn 429 by 720, finds one quiet field, y 80-240 — fifth
       * percentile 0.74-0.83, texture 0.006-0.019. Below it the arch and the
       * couple run texture 0.05-0.13 with fully dark pixels.
       */
      cap(ctx, { kz: 'ҮЙЛЕНУ ТОЙЫ', ru: 'СВАДЬБА' }, 88, { color: ctx.theme.ink, onPhoto: true, size: T.small }),
      {
        type: 'text',
        props: {
          x: 6,
          y: 118,
          w: 88,
          h: 'auto',
          text: options.names ?? 'Айдар & Айсұлу',
          fontFamily: 'Lavanderia',
          fontSize: T.name,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.05,
          letterSpacing: 0,
          textShadow: GLOW,
          placeholderKey: 'coupleNames',
          editableByEndUser: true,
          editableProperties: ['text', 'color', 'fontSize'],
        },
        animate: { type: 'fade', duration: 2.8, delay: 0.2 },
      },
      {
        type: 'text',
        props: {
          x: 15,
          y: 184,
          w: 70,
          h: 'auto',
          text: '15 . 05 . 2027',
          fontFamily: 'Cormorant',
          fontSize: T.small,
          fontWeight: 600,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: 5,
          textShadow: GLOW_TIGHT,
          placeholderKey: 'eventDate',
          editableByEndUser: true,
          editableProperties: ['text'],
        },
        animate: { type: 'fade', duration: 2.4, delay: 0.6 },
      },
    ],
    height: 720,
  });
}

// ---------------------------------------------------------------------------
// 2. Greeting — the plate rides up over the hero
// ---------------------------------------------------------------------------

export function zhuparGreeting(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      /*
       * Negative local y is the device.
       *
       * The composer places a section's elements at its cursor plus their own
       * y, so -56 lays the plate across the hero's faded foot instead of under
       * it. It is drawn above the hero because z rises down the page. toi's
       * template 27 does the same thing with a negative top margin on its card.
       */
      // 440: rendered at 500, the three-line greeting left 164px of empty plate
      // under it.
      plate(ctx, -OVERLAP, 440),
      quarter(ctx, -OVERLAP, 'top-left'),
      quarter(ctx, -OVERLAP + 440 - 78, 'bottom-right'),
      medallion(ctx, -OVERLAP + 28, { x: 43, w: 14, opacity: 0.85 }),
      head(ctx, { kz: 'Құрметті қонақтар!', ru: 'Дорогие гости!' }, 50),
      body(
        ctx,
        {
          kz: 'Балаларымыз Айдар мен Айсұлудың үйлену тойына шақырамыз.',
          ru: 'Приглашаем вас на свадьбу наших детей Айдара и Айсулу.',
        },
        50 + 2 * HEAD_LINE + 26,
      ),
    ],
    height: 420,
  });
}

// ---------------------------------------------------------------------------
// 3. Hosts — the rings in an oval with two hairline rings round it
// ---------------------------------------------------------------------------

/** The photograph's box, and rings 7 and 15px outside it, all on AX.right. */
const OVAL = { x: 38, y: 40, w: 58, h: 320 } as const;

function ring(ctx: SectionContext, outset: number, opacity: number): ElementSpec {
  const dx = (outset / 390) * 100;
  return {
    type: 'shape',
    props: {
      x: OVAL.x - dx,
      y: OVAL.y - outset,
      w: OVAL.w + 2 * dx,
      h: OVAL.h + 2 * outset,
      shape: 'circle',
      fill: 'transparent',
      stroke: gold(ctx),
      strokeWidth: 1,
      opacity,
    },
    animate: false,
  };
}

export function zhuparHosts(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      medallion(ctx, 150, { x: -12, w: 34, opacity: 0.35 }),
      ring(ctx, 15, 0.55),
      ring(ctx, 7, 0.9),
      {
        type: 'image',
        props: {
          x: OVAL.x,
          y: OVAL.y,
          w: OVAL.w,
          h: OVAL.h,
          src: A.rings,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskShape: 'oval',
          placeholderKey: 'couplePhoto',
          editableByEndUser: true,
          editableProperties: ['imageSrc'],
        },
        animate: { type: 'fade', duration: 2.6 },
      },
      cap(ctx, { kz: 'ТОЙ ИЕЛЕРІ', ru: 'ХОЗЯЕВА ТОЯ' }, 392, { x: 6, w: 54, align: 'left' }),
      {
        type: 'text',
        props: {
          x: 6,
          y: 428,
          w: 54,
          h: 'auto',
          text: t({ kz: 'Ахметовтер әулеті', ru: 'Семья Ахметовых' }, ctx),
          fontFamily: 'Cormorant',
          fontSize: T.lead,
          fontWeight: 500,
          color: ctx.theme.ink,
          textAlign: 'left',
          lineHeight: 1.25,
          letterSpacing: 0.3,
          placeholderKey: 'heroSubtitle',
          editableByEndUser: true,
          editableProperties: ['text'],
        },
        animate: { type: 'slideLeft', duration: 2.6 },
      },
      medallion(ctx, 500, { x: 44, w: 12, rotation: 45, opacity: 0.8 }),
    ],
    height: 560,
  });
}

// ---------------------------------------------------------------------------
// 4. Programme of the day
// ---------------------------------------------------------------------------

export function zhuparProgram(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      band(ctx, 10),
      head(ctx, { kz: 'Той бағдарламасы', ru: 'Программа дня' }, 72),
      {
        type: 'program',
        props: {
          x: 8,
          y: 140,
          w: 84,
          h: 300,
          variant: 'rail',
          fontFamily: 'Monolog',
          fontSize: 18,
          iconSize: 44,
          iconColor: gold(ctx),
          // The mark on the rail is the medallion itself at 14px, so the row
          // markers are Kazakh ornament and not a generic dot or heart.
          markerSrc: A.medallion,
          markerSize: 14,
          markerColor: gold(ctx),
          lineColor: 'rgba(168,146,90,0.55)',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          timeColor: ctx.theme.muted,
          items: [
            { id: 'guests', time: '17:00', title: t({ kz: 'Қонақтарды қарсы алу', ru: 'Встреча гостей' }, ctx), icon: A.iconKese },
            { id: 'betashar', time: '18:00', title: t({ kz: 'Беташар', ru: 'Беташар' }, ctx), icon: A.iconSaukele },
            { id: 'toi', time: '19:00', title: t({ kz: 'Той салтанаты', ru: 'Торжество' }, ctx), icon: A.iconDombra },
            { id: 'cake', time: '22:00', title: t({ kz: 'Той торты', ru: 'Свадебный торт' }, ctx), icon: A.iconTort },
          ],
        },
        animate: { type: 'fadeUp', duration: 2.2 },
      },
    ],
    height: 460,
  });
}

// ---------------------------------------------------------------------------
// 5. When
// ---------------------------------------------------------------------------

export function zhuparWhen(options: { targetIso: string }): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      medallion(ctx, 110, { x: 26, w: 48, opacity: 0.12, spin: true }),
      head(ctx, { kz: 'Той күні', ru: 'Дата свадьбы' }, 30),
      {
        type: 'calendar',
        props: {
          x: 12,
          y: 118,
          w: 76,
          h: 350,
          targetIso: options.targetIso,
          accentColor: ctx.theme.accent,
          color: ctx.theme.ink,
          fontFamily: 'Monolog',
          fontSize: 14,
          markStyle: 'heart',
        },
        animate: { type: 'revealUp', duration: 2.6 },
      },
      {
        type: 'countdown',
        props: {
          x: 8,
          y: 488,
          w: 84,
          h: 110,
          targetIso: options.targetIso,
          color: ctx.theme.ink,
          accentColor: ctx.theme.muted,
          fontFamily: 'Cormorant',
          fontSize: 28,
        },
        animate: { type: 'fade', duration: 2.8 },
      },
    ],
    height: 610,
  });
}

// ---------------------------------------------------------------------------
// 6. Dress code
// ---------------------------------------------------------------------------

function swatch(ctx: SectionContext, centre: number, y: number, fill: string, stroke?: string): ElementSpec {
  const w = (44 / 390) * 100;
  return {
    type: 'shape',
    props: {
      x: centre - w / 2,
      y,
      w,
      h: 44,
      shape: 'circle',
      fill,
      stroke: stroke ?? 'transparent',
      strokeWidth: stroke ? 1 : 0,
    },
    animate: { type: 'fade', duration: 2.4 },
  };
}

export function zhuparDress(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Дресс-код', ru: 'Дресс-код' }, 20),
      body(ctx, { kz: 'Ақ, жасыл және алтын түстер', ru: 'Белый, зелёный и золотой' }, 86, 72, T.small),
      swatch(ctx, AX.left, 150, '#FFFFFF', '#D6D2C2'),
      swatch(ctx, AX.mid, 150, ctx.theme.accent),
      swatch(ctx, AX.right, 150, gold(ctx)),
    ],
    height: 260,
  });
}

// ---------------------------------------------------------------------------
// 7. Location — the table, with the type on its empty cloth
// ---------------------------------------------------------------------------

export function zhuparLocation(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: -5,
          y: 0,
          w: 110,
          h: 400,
          src: A.table,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskFade: { top: 8, bottom: 22 },
        },
        animate: { type: 'fade', duration: 2.4 },
      },
      cap(ctx, { kz: 'МЕКЕН-ЖАЙЫ', ru: 'АДРЕС' }, 38, { color: ctx.theme.ink, onPhoto: true }),
      {
        type: 'text',
        props: {
          x: 8,
          y: 66,
          w: 84,
          h: 'auto',
          text: t({ kz: '«Алтын Орда», Алматы', ru: '«Алтын Орда», Алматы' }, ctx),
          fontFamily: 'Cormorant',
          fontSize: T.lead,
          fontWeight: 500,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: 0.3,
          textShadow: GLOW,
          placeholderKey: 'venueName',
          editableByEndUser: true,
          editableProperties: ['text'],
        },
        animate: { type: 'slideLeft', duration: 2.6 },
      },
      {
        type: 'map',
        props: {
          x: 10,
          y: 430,
          w: 80,
          h: 300,
          address: '',
          markerTitle: '',
          showStaticOnly: false,
          accentColor: ctx.theme.accent,
          textColor: ctx.theme.ink,
          bgColor: ctx.theme.paper,
          fontFamily: 'Monolog',
          placeholderKey: 'venueAddress',
          editableByEndUser: true,
          editableProperties: ['text'],
        },
        animate: { type: 'revealUp', duration: 2.6 },
      },
    ],
    height: 760,
  });
}

// ---------------------------------------------------------------------------
// 8. RSVP
// ---------------------------------------------------------------------------

export function zhuparRsvp(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      plate(ctx, 20, 740),
      quarter(ctx, 20, 'top-left'),
      quarter(ctx, 20 + 740 - 78, 'bottom-right'),
      head(ctx, { kz: 'Қатысуыңызды растаңыз', ru: 'Подтвердите присутствие' }, 96),
      body(
        ctx,
        { kz: 'Тойға келетініңізді хабарлаңыз.', ru: 'Сообщите, придёте ли вы.' },
        96 + 2 * HEAD_LINE + 26,
        68,
        T.small,
      ),
      {
        type: 'rsvp-form',
        props: {
          x: 12,
          y: 286,
          w: 76,
          h: 470,
          fontFamily: 'Monolog',
          title: '',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          askPlusOne: true,
          askDietary: false,
        },
        animate: { type: 'fadeUp', duration: 2.0 },
      },
    ],
    height: 780,
  });
}

// ---------------------------------------------------------------------------
// 9. Wishes
// ---------------------------------------------------------------------------

export function zhuparWishes(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Ізгі тілектер', ru: 'Добрые пожелания' }, 24),
      {
        type: 'wishes',
        props: {
          x: 10,
          y: 106,
          w: 80,
          h: 344,
          title: '',
          fontFamily: 'Monolog',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          allowAnonymous: true,
        },
        animate: { type: 'fadeUp', duration: 2.2 },
      },
    ],
    height: 480,
  });
}

// ---------------------------------------------------------------------------
// 10. Closing — with a signature
// ---------------------------------------------------------------------------

export function zhuparClosing(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      band(ctx, 16),
      medallion(ctx, 90, { x: 22, w: 56, opacity: 0.14 }),
      body(
        ctx,
        { kz: 'Тойымыздың қадірлі қонағы болыңыздар!', ru: 'Будьте дорогими гостями нашего тоя!' },
        150,
        70,
      ),
      cap(ctx, { kz: 'ІЗГІ НИЕТПЕН,', ru: 'С ЛЮБОВЬЮ,' }, 262),
      {
        type: 'text',
        props: {
          x: 6,
          y: 290,
          w: 88,
          h: 'auto',
          text: t({ kz: 'Ахметовтер әулеті', ru: 'семья Ахметовых' }, ctx),
          fontFamily: 'Lavanderia',
          fontSize: T.head,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: 0,
        },
        animate: { type: 'fade', duration: 2.8, delay: 0.3 },
      },
      quarter(ctx, 460 - 78, 'bottom-right'),
    ],
    height: 460,
  });
}
