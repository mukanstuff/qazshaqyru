/**
 * Sections for «Інжу» — үйлену тойы.
 *
 * Built from two measured documents rather than taste:
 *
 *  - `docs/design-vocabulary.md` — geometry, read out of 53 toi template files
 *    and 26 shaqyru24 canvas documents. Every number below that has a threshold
 *    attached to it comes from a percentile or a median in that file, never
 *    from an illustrative example (see check C14 in `template-self-check.md`).
 *  - `docs/visual-register.md` — light, tone and motion, read off live
 *    screenshots of the eight best-selling demos. That is where the palette
 *    and the photography brief come from: the whole category is high-key warm
 *    white, and a dark evening photograph dissolving into cream paper — the
 *    first thing tried here — reads as a page from a different template.
 *
 * What this template uses that the engine has always supported and no shipped
 * template ever set: `maskShape: 'arch'`, `maskFade` on the hero, `idle` spin
 * on an ornament, `pinned` action buttons, the envelope gate, auto-scroll, and
 * a repeated paper ground.
 *
 * Ornament policy: one medallion file appears five times at three scales and
 * five rotations, one band twice at two scales, one corner three times. That
 * ratio is the point — the reference templates carry a median of four unique
 * ornament files and re-use them 1.7 times each, while photographs appear once.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };
const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

const A = {
  hero: '/assets/templates/inju/hero-silk-pearls.webp',
  arch: '/assets/templates/inju/arch-hands.webp',
  bracelet: '/assets/templates/inju/collage-bracelet.webp',
  envelope: '/assets/templates/inju/collage-envelope.webp',
  medallion: '/assets/templates/inju/oyu-medallion.png',
  band: '/assets/templates/inju/oyu-divider.png',
  corner: '/assets/templates/inju/oyu-corner.png',
} as const;

/**
 * Six sizes with a deliberate break in the middle.
 *
 * Authored at the reference width of 430 as 18 / 21 / 25 / 34 / 44 / 68 and
 * scaled by 390/430. Ratio top-to-bottom is 3.9x against a measured median of
 * 3.6, and the largest single step is 40 -> 62, i.e. 1.55x against a measured
 * median of 1.64. Neither value appears in the vocabulary as an example.
 */
const T = {
  cap: 16,
  small: 19,
  body: 23,
  lead: 31,
  head: 40,
  name: 62,
} as const;

/** Three content anchors. Decor lives outside them, on the bleed rail. */
const X = { left: 29, mid: 50, right: 71 } as const;

const gold = (ctx: SectionContext) => ctx.theme.accentDeep ?? ctx.theme.accent;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Small letterspaced capitals — the label voice of the whole category. */
function cap(ctx: SectionContext, copy: Copy, y: number, color?: string, align: 'center' | 'left' = 'center'): ElementSpec {
  return {
    type: 'text',
    props: {
      x: 8,
      y,
      w: 84,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Romul',
      fontSize: T.cap,
      fontWeight: 400,
      color: color ?? ctx.theme.muted,
      textAlign: align,
      lineHeight: 1.6,
      letterSpacing: 3.6,
      uppercase: true,
    },
    animate: { type: 'fade', duration: 2.2 },
  };
}

function head(ctx: SectionContext, copy: Copy, y: number, color?: string): ElementSpec {
  return {
    type: 'text',
    props: {
      x: 8,
      y,
      w: 84,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Monumenta',
      fontSize: T.head,
      fontWeight: 400,
      color: color ?? ctx.theme.ink,
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
    animate: { type: 'slideLeft', duration: 2.6 },
  };
}

function body(ctx: SectionContext, copy: Copy, y: number, w = 71, size = T.small): ElementSpec {
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
      lineHeight: 1.7,
      letterSpacing: 0,
    },
    animate: { type: 'slideRight', duration: 2.6 },
  };
}

/**
 * The medallion, at one of three scales and one of five rotations.
 *
 * Same file every time. `spin` is reserved for the single largest instance:
 * all 45 looping rotations in the reference set are on images, one per page,
 * and a page with five turning ornaments would read as a screensaver.
 */
function medallion(
  ctx: SectionContext,
  y: number,
  opts: { x: number; w: number; rotation: number; opacity?: number; spin?: boolean }
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
      rotation: opts.rotation,
      ...(opts.opacity !== undefined ? { opacity: opts.opacity } : {}),
      ...(opts.spin ? { idle: { type: 'spin', duration: 30 } } : {}),
    },
    /*
     * Opacity only, no transform.
     *
     * A tinted ornament is painted as a background colour behind a
     * mask-image. Put that on a layer that a transform-based entrance has
     * promoted to its own compositor surface and the browser paints the
     * element's whole box, not just the silhouette: every medallion sat in a
     * faint rotated square of flat colour. A fade never promotes the layer
     * the same way, and the mask survives.
     */
    animate: { type: 'fade', duration: 2.0 },
  };
}

/** The band. Wider than the page on purpose — it is cut by both edges. */
function band(ctx: SectionContext, y: number, w = 110): ElementSpec {
  return {
    type: 'image',
    props: {
      x: (100 - w) / 2,
      y,
      w,
      h: Math.round((w / 100) * 390 * 0.28),
      src: A.band,
      alt: '',
      objectFit: 'contain',
      borderRadius: 0,
      tint: gold(ctx),
      opacity: 0.85,
    },
    animate: { type: 'fade', duration: 2.4 },
  };
}

/**
 * A corner piece on the bleed rail.
 *
 * Half of it is off the canvas by design: a corner ornament carries its mass
 * in one corner, so cropping the outer half still leaves a finished edge.
 */
function corner(
  ctx: SectionContext,
  y: number,
  opts: { side: 'left' | 'right'; w?: number; rotation?: number; opacity?: number }
): ElementSpec {
  const w = opts.w ?? 26;
  return {
    type: 'image',
    props: {
      x: opts.side === 'left' ? -9 : 100 - w + 9,
      y,
      w,
      h: Math.round((w / 100) * 390),
      src: A.corner,
      alt: '',
      objectFit: 'contain',
      borderRadius: 0,
      tint: gold(ctx),
      opacity: opts.opacity ?? 0.5,
      rotation: opts.rotation ?? (opts.side === 'left' ? 0 : 90),
    },
    animate: false,
  };
}

/**
 * A photograph bleached back until it is texture, with the section's type on
 * top of it.
 *
 * Measured, not invented: on the best-selling reference card the address block
 * sits on a full-bleed photograph of a hand holding a carnation, faded until
 * the flower is barely legible, and the warm gold type reads cleanly over it.
 * It is also what makes a photograph work when the picture itself is not
 * strong enough to be shown at full strength — which is the honest verdict on
 * the two still lifes that used to be a collage here.
 */
function wash(src: string, y: number, h: number, opacity = 0.22): ElementSpec {
  return {
    type: 'image',
    props: {
      x: -5.5,
      y,
      w: 111,
      h,
      src,
      alt: '',
      objectFit: 'cover',
      borderRadius: 0,
      opacity,
      maskFade: { top: 18, bottom: 18 },
      grade: { saturate: 60, brightness: 112 },
    },
    animate: false,
  };
}

/** A filled panel that always sits wider than the text it carries. */
function panel(ctx: SectionContext, y: number, h: number, w = 87): ElementSpec {
  return {
    type: 'shape',
    props: {
      x: (100 - w) / 2,
      y,
      w,
      h,
      shape: 'rect',
      fill: '#FFFFFF',
      opacity: 0.62,
      radius: 16,
      shadow: { x: 0, y: 10, blur: 22, color: 'rgba(0,0,0,0.18)' },
    },
    animate: false,
  };
}

// ---------------------------------------------------------------------------
// 1. Hero — silk, pearls, and the names on two anchors
// ---------------------------------------------------------------------------

export function injuHero(options: { first?: string; second?: string } = {}): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          // 111% of the page: 24px past each edge at the reference width,
          // inside the measured 20-60px working range for a bleed.
          x: -5.5,
          y: 0,
          w: 111,
          h: 470,
          src: A.hero,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          // The dissolve, not a hard edge. 26% of the height feathers away,
          // so the picture ends at 74% and the paper takes over — the
          // measured break point across the reference set is 70-78%.
          maskFade: { bottom: 26 },
          /*
           * A scrim, because legibility beat the photograph.
           *
           * The names sat straight on a strand of pearls and a spray of
           * roses: warm ink on a busy, equally warm ground, and both the
           * label and the first name were lost. The reference cards never
           * ask type to survive that — they either shoot a plain ground or
           * lay a wash over it. This is the wash: transparent across the
           * top third where the photograph is doing the work, then paper
           * tone from the point the type begins.
           */
          overlayGradient: { from: 'rgba(246,241,232,0)', to: 'rgba(246,241,232,0.55)', angle: 180 },
        },
        // The schema caps an entrance at 10s, which is the right cap: this is
        // a slow push on a still photograph, not a video.
        animate: { type: 'kenBurns', duration: 10, delay: 0 },
      },
      corner(ctx, 96, { side: 'left', w: 26, opacity: 0.34 }),
      /*
       * The names come off the photograph.
       *
       * They were set straight over a strand of pearls and a spray of roses,
       * warm ink on an equally warm, busy ground, and both the label and the
       * first name disappeared into it. A scrim alone does not fix that — it
       * only flattens the picture that was the reason to use it. The
       * best-selling reference card does the obvious thing instead: the
       * photograph takes the top of the screen, the type sits under it on
       * plain paper, and the only line left on the picture is the label,
       * which sits in the zone the mask has already faded to paper.
       */
      cap(ctx, { kz: 'ҮЙЛЕНУ ТОЙҒА ШАҚЫРУ', ru: 'ПРИГЛАШЕНИЕ НА СВАДЬБУ' }, 396, ctx.theme.ink),
      {
        type: 'text',
        props: {
          x: X.left - 23,
          y: 468,
          w: 46,
          h: 'auto',
          text: options.first ?? 'Самат',
          fontFamily: 'Shelley',
          fontSize: T.name,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.05,
          letterSpacing: 0,
          placeholderKey: 'groomName',
          editableByEndUser: true,
          editableProperties: ['text', 'color', 'fontSize'],
        },
        animate: { type: 'letters', duration: 2.6, delay: 0.1 },
      },
      {
        type: 'text',
        props: {
          x: 44,
          y: 552,
          w: 12,
          h: 'auto',
          text: '&',
          fontFamily: 'Monumenta',
          fontSize: T.lead,
          fontWeight: 400,
          color: gold(ctx),
          textAlign: 'center',
          lineHeight: 1,
          letterSpacing: 0,
        },
        animate: { type: 'fade', duration: 2.6, delay: 0.35 },
      },
      {
        type: 'text',
        props: {
          x: X.right - 23,
          y: 598,
          w: 46,
          h: 'auto',
          text: options.second ?? 'Динара',
          fontFamily: 'Shelley',
          fontSize: T.name,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.05,
          letterSpacing: 0,
          placeholderKey: 'brideName',
          editableByEndUser: true,
          editableProperties: ['text', 'color', 'fontSize'],
        },
        animate: { type: 'letters', duration: 2.6, delay: 0.5 },
      },
      cap(ctx, { kz: '15 . 05 . 2027', ru: '15 . 05 . 2027' }, 700, ctx.theme.ink),
    ],
    height: 764,
  });
}

// ---------------------------------------------------------------------------
// 2. Band
// ---------------------------------------------------------------------------

export function injuBand(w = 110): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [band(ctx, 8, w)],
    height: Math.round((w / 100) * 390 * 0.28) + 34,
  });
}

// ---------------------------------------------------------------------------
// 3. Greeting — panel wider than its text
// ---------------------------------------------------------------------------

export function injuGreeting(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      panel(ctx, 0, 476),
      medallion(ctx, 24, { x: 42, w: 16, rotation: 12 }),
      head(ctx, { kz: 'Құрметті қонақтар!', ru: 'Дорогие гости!' }, 116),
      body(
        ctx,
        {
          kz: 'Сіздерді ұлымыз Самат пен қызымыз Динараның үйлену тойына арналған салтанатты ақ дастарханымыздың қадірлі қонағы болуға шақырамыз.',
          ru: 'Приглашаем вас разделить с нами торжество по случаю бракосочетания наших детей — Самата и Динары.',
        },
        222,
        78
      ),
    ],
    height: 524,
  });
}

// ---------------------------------------------------------------------------
// 4. Arch — the one photograph with a shaped silhouette
// ---------------------------------------------------------------------------

export function injuArch(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          // Centred on the right anchor, so 12% of it runs past the right
          // edge: an off-axis block and a bleed in the same element.
          x: X.right - 41,
          y: 0,
          w: 82,
          h: 450,
          src: A.arch,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskShape: 'arch',
          shadow: { x: 0, y: 18, blur: 34, color: 'rgba(58,42,28,0.20)' },
        },
        animate: { type: 'slideRight', duration: 2.4 },
      },
      corner(ctx, 250, { side: 'left', w: 24, rotation: 0, opacity: 0.42 }),
      cap(ctx, { kz: 'БІЗДІҢ ТОЙЫМЫЗ', ru: 'НАША СВАДЬБА' }, 392, ctx.theme.ink, 'left'),
    ],
    height: 548,
  });
}

// ---------------------------------------------------------------------------
// 5. Hosts — the pause between two dense blocks
// ---------------------------------------------------------------------------

export function injuHosts(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      cap(ctx, { kz: 'ТОЙ ИЕЛЕРІ', ru: 'ХОЗЯЕВА ТОРЖЕСТВА' }, 0, ctx.theme.muted),
      {
        type: 'text',
        props: {
          x: 12,
          y: 56,
          w: 76,
          h: 'auto',
          text: t({ kz: 'Болмановтар әулеті', ru: 'Семья Болмановых' }, ctx),
          fontFamily: 'Shelley',
          fontSize: T.head,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.25,
          letterSpacing: 0,
        },
        animate: { type: 'slideLeft', duration: 2.6 },
      },
    ],
    height: 210,
  });
}

// ---------------------------------------------------------------------------
// 6. When — calendar and countdown
// ---------------------------------------------------------------------------

export function injuWhen(options: { targetIso?: string } = {}): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      medallion(ctx, 0, { x: 40, w: 20, rotation: 163, opacity: 0.9 }),
      head(ctx, { kz: 'Өтетін күні', ru: 'Дата торжества' }, 104),
      {
        type: 'calendar',
        props: {
          x: 12,
          y: 176,
          w: 76,
          h: 350,
          targetIso: options.targetIso,
          fontFamily: 'Romul',
          fontSize: T.cap,
          color: ctx.theme.ink,
          accentColor: gold(ctx),
          markStyle: 'ring',
          showMonthTitle: true,
          showWeekdays: true,
        },
        animate: { type: 'fadeDown', duration: 2.2 },
      },
      {
        type: 'countdown',
        props: {
          x: 10,
          y: 596,
          w: 80,
          h: 96,
          targetIso: options.targetIso,
          fontFamily: 'Monumenta',
          fontSize: T.lead,
          color: ctx.theme.ink,
          accentColor: gold(ctx),
          showLabels: true,
        },
        animate: { type: 'zoomIn', duration: 2.0 },
      },
    ],
    height: 738,
  });
}

// ---------------------------------------------------------------------------
// 7. Turning medallion — the one thing on the page that never stops
// ---------------------------------------------------------------------------

/**
 * What used to be a collage of two still lifes.
 *
 * The pair read as a moodboard rather than as an invitation: a silver bangle
 * and a sealed envelope, shown at full strength, are two product shots with no
 * relation to each other. Both photographs are still in the template, but as
 * bleached grounds under the hosts and the closing, which is how the reference
 * cards use a picture that is texture rather than subject. What is left here
 * is the ornament at its largest, turning once every thirty seconds — the
 * device measured on 45 components across the reference set, always an image,
 * always exactly one per page.
 */
export function injuMedallion(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [medallion(ctx, 0, { x: 36, w: 28, rotation: 205, spin: true })],
    height: 200,
  });
}

// ---------------------------------------------------------------------------
// 8. Location — the framed panel
// ---------------------------------------------------------------------------

export function injuLocation(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'shape',
        props: {
          x: 6.5,
          y: 0,
          w: 87,
          h: 388,
          shape: 'rect',
          fill: 'transparent',
          stroke: gold(ctx),
          strokeWidth: 2,
          radius: 33,
        },
        animate: false,
      },
      head(ctx, { kz: 'Мекен-жайы', ru: 'Адрес' }, 40),
      {
        type: 'text',
        props: {
          x: 14,
          y: 150,
          w: 72,
          h: 'auto',
          text: t({ kz: 'Алматы', ru: 'Алматы' }, ctx),
          fontFamily: 'Romul',
          fontSize: T.lead,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: 1,
          placeholderKey: 'venueAddress',
        },
        animate: { type: 'slideRight', duration: 2.4 },
      },
      {
        type: 'text',
        props: {
          x: 14,
          y: 200,
          w: 72,
          h: 'auto',
          text: t({ kz: '«Абиба» мейрамханасы', ru: 'ресторан «Абиба»' }, ctx),
          fontFamily: 'Romul',
          fontSize: T.small,
          fontWeight: 400,
          color: ctx.theme.muted,
          textAlign: 'center',
          lineHeight: 1.5,
          letterSpacing: 0,
          placeholderKey: 'venueName',
        },
        animate: { type: 'slideLeft', duration: 2.4 },
      },
      {
        type: 'button',
        props: {
          x: 24,
          y: 296,
          w: 52,
          h: 48,
          label: t({ kz: 'Картаны ашу', ru: 'Открыть карту' }, ctx),
          action: { kind: 'map' },
          bgColor: gold(ctx),
          textColor: '#FFFFFF',
          fontSize: T.cap,
          fontFamily: 'Romul',
          fontWeight: 500,
          borderRadius: 999,
        },
        animate: { type: 'fadeUp', duration: 2.0 },
      },
    ],
    height: 444,
  });
}

// ---------------------------------------------------------------------------
// 9. RSVP
// ---------------------------------------------------------------------------

export function injuRsvp(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      // The bracelet photograph, bleached and put where a photograph of an
      // object belongs in this register: under a translucent panel, as the
      // ground the form sits on rather than as a picture in its own frame.
      wash(A.bracelet, 60, 470, 0.09),
      panel(ctx, 0, 800),
      medallion(ctx, 22, { x: 42, w: 16, rotation: 322, opacity: 0.8 }),
      head(ctx, { kz: 'Қатысуыңызды растаңыз', ru: 'Подтвердите присутствие' }, 110),
      body(
        ctx,
        {
          kz: 'Тойға келуіңізді растауыңызды сұраймыз.',
          ru: 'Просим подтвердить ваше присутствие.',
        },
        226,
        76,
        T.small
      ),
      {
        type: 'rsvp-form',
        props: {
          x: 12,
          y: 296,
          w: 76,
          h: 470,
          fontFamily: 'Romul',
          // The section above already carries the heading and the lead line.
          title: '',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: gold(ctx),
          askPlusOne: true,
          askPhone: false,
          askDietary: false,
          askChildren: false,
        },
        animate: { type: 'fadeUp', duration: 2.0 },
      },
    ],
    height: 850,
  });
}

// ---------------------------------------------------------------------------
// 10. Wishes
// ---------------------------------------------------------------------------

export function injuWishes(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Ізгі тілектер', ru: 'Добрые пожелания' }, 0),
      {
        type: 'wishes',
        props: {
          x: 8,
          y: 118,
          w: 84,
          h: 350,
          fontFamily: 'Romul',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: gold(ctx),
          reactions: ['❤️', '🎉', '🤍'],
          allowAnonymous: true,
        },
        animate: { type: 'slideRight', duration: 2.4 },
      },
    ],
    height: 500,
  });
}

// ---------------------------------------------------------------------------
// 11. Closing
// ---------------------------------------------------------------------------

export function injuClosing(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      wash(A.envelope, 40, 360, 0.18),
      band(ctx, 0, 106),
      medallion(ctx, 78, { x: 40, w: 20, rotation: 97, opacity: 0.85 }),
      {
        type: 'text',
        props: {
          x: 10,
          y: 190,
          w: 80,
          h: 'auto',
          text: t(
            { kz: 'Тойымыздың қадірлі қонағы болыңыздар!', ru: 'Будем рады видеть вас на нашем торжестве!' },
            ctx
          ),
          fontFamily: 'Monumenta',
          fontSize: T.body,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.6,
          letterSpacing: 0,
        },
        animate: { type: 'slideLeft', duration: 2.6 },
      },
      /*
       * Flush into the page's own bottom-right corner.
       *
       * Floating it beside the closing line turned a corner ornament into a
       * loose triangle: the shape only reads as a corner when it is actually
       * in one, with its two straight edges on the page edges. Rotated 180 so
       * its mass falls into the corner rather than away from it.
       */
      corner(ctx, 318, { side: 'right', w: 34, rotation: 180, opacity: 0.34 }),
    ],
    height: 452,
  });
}
