/**
 * Sections for «Тақия» — сүндет той.
 *
 * The first template in the category, so there is no sibling to differ from;
 * what it has to differ from is the category at the competitors. Eleven of
 * toi's twelve сүндет той cards are built on a child's face — a photograph in
 * an oval, a cartoon boy, a portrait in a shapan — and two are dark navy. Both
 * are ruled out here (no faces, no dark), so the page is carried by objects
 * and by a figure seen from behind: the takiya held up in two hands, the
 * shapan's embroidery, the white dastarkhan, and in the hero the boy on a white
 * horse, which is the rite itself (атқа мінгізу).
 *
 * Register and palette: light, pale blue linen ground, deep navy ink, gold in
 * the ornament. That is the category's own convention at toi for its light
 * cards, with gold as the accent rather than their mid blue, because navy with
 * gold is what the ceremony is dressed in. Nothing else in the catalogue is
 * cool-blue: seven wedding cards are cream and gold, «Сәукеле» is silver.
 *
 * The owner's clarification of 2026-09-13 applies to the hero: horse, steppe
 * and yurt are allowed when they read as ceremony — a white horse in gold tack
 * under the Alatau — and not as a bare plain.
 *
 * Structure follows «Сәукеле», which passes the numeric gate 31/31: the same
 * skeleton, the same measured devices, a different instance.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };
const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

const A = {
  heroVideo: '/assets/templates/taqiya/hero.webm',
  heroPoster: '/assets/templates/taqiya/hero-poster.webp',
  taqiya: '/assets/templates/taqiya/hero-taqiya.webp',
  shapan: '/assets/templates/taqiya/story-shapan.webp',
  dastarkhan: '/assets/templates/taqiya/story-dastarkhan.webp',
  medallion: '/assets/templates/taqiya/oyu-medallion.png',
  band: '/assets/templates/taqiya/oyu-band-tile.png',
  corner: '/assets/templates/taqiya/oyu-corner.png',
} as const;

/**
 * Six sizes, the break between `lead` and `head`.
 *
 * 15 / 18 / 22 / 27 / 42 / 60: top to bottom 4.0x, largest step 1.56x. The
 * name is 60 rather than «Сәукеле»'s 53 because it is set in a script, and a
 * script at a given size carries noticeably less ink than an antiqua.
 */
const T = {
  cap: 15,
  small: 18,
  body: 22,
  lead: 27,
  head: 42,
  name: 60,
} as const;

/** One line of `head()` in px, 42 × 1.18 rounded up. See «Сәукеле»: anything
 *  under a heading has to be told how tall the heading is, and Kazakh headings
 *  wrap where their Russian twins do not. */
const HEAD_LINE = 50;

const gold = (ctx: SectionContext) => ctx.theme.accentDeep ?? ctx.theme.accent;

/** White glow under dark type on light footage — measured on toi, see
 *  `design-vocabulary.md` §3.22. */
const GLOW = { x: 0, y: 2, blur: 9, color: 'rgba(255,255,255,0.8)' } as const;
const GLOW_TIGHT = { x: 0, y: 1, blur: 4, color: 'rgba(255,255,255,0.95)' } as const;

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
      letterSpacing: 3.6,
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

function body(ctx: SectionContext, copy: Copy, y: number, w = 74, size: number = T.small): ElementSpec {
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

/**
 * The medallion does five jobs: small plate over the greeting, divider under
 * the hosts, large rotated half-off-page beside the takiya, faint and turning
 * behind the calendar, faint under the closing line. The divider role is why
 * there is no separate divider file — every generated divider came back as
 * European wrought iron, and the competitors use the small medallion anyway.
 */
function medallion(
  ctx: SectionContext,
  y: number,
  opts: { x: number; w: number; rotation: number; opacity?: number; spin?: boolean },
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
    animate: { type: 'fade', duration: 2.0 },
  };
}

/**
 * The band, tiled.
 *
 * The generated band came as two rows fused along their whole height — 1370
 * by 351, so one copy stretched across the page would stand 118px tall. It is
 * cut to exactly three pattern periods (343.7px each, the seam matching to 0.2
 * grey levels) and repeated along x at 56px, which gives the thin run of small
 * repeating ою the reference set puts under its headings.
 */
function band(ctx: SectionContext, y: number): ElementSpec {
  return {
    type: 'image',
    props: {
      x: -9,
      y,
      w: 118,
      h: 56,
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

function corner(
  ctx: SectionContext,
  y: number,
  opts: { side: 'left' | 'right'; w: number; opacity?: number; flipY?: boolean },
): ElementSpec {
  const rotation = opts.side === 'left' ? (opts.flipY ? 270 : 0) : opts.flipY ? 180 : 90;
  return {
    type: 'image',
    props: {
      x: opts.side === 'left' ? -4 : 104 - opts.w,
      y,
      w: opts.w,
      h: Math.round((opts.w / 100) * 390),
      src: A.corner,
      alt: '',
      objectFit: 'contain',
      borderRadius: 0,
      tint: gold(ctx),
      rotation,
      opacity: opts.opacity ?? 0.45,
    },
    // Decor on a fixed cue of its own is what makes a page a slideshow; the
    // gate caps the animated share at 89%.
    animate: false,
  };
}

function panel(ctx: SectionContext, y: number, h: number, w = 88): ElementSpec {
  return {
    type: 'shape',
    props: {
      x: (100 - w) / 2,
      y,
      w,
      h,
      shape: 'rect',
      fill: 'rgba(255,255,255,0.66)',
      radius: 4,
      stroke: 'transparent',
      strokeWidth: 0,
      shadow: { x: 0, y: 8, blur: 24, color: 'rgba(29,49,80,0.08)' },
    },
    // A plate sliding in under its own text reads as a loading fault. Stated
    // in «Сәукеле» and never set there: the key was missing, so the composer
    // gave every panel its default entrance.
    animate: false,
  };
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------

export function taqiyaHero(options: { name?: string } = {}): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      // The still under the clip carries the screen if the clip does not play.
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
          // The clip ends on an ivory meadow and the page is pale blue; a hard
          // bottom edge between the two is the first seam a guest sees.
          maskFade: { bottom: 18 },
        },
      },
      /*
       * Type in the sky, measured before it was placed.
       *
       * `measure-frame.mjs` on the clip's first frame, drawn 429 by 720: the
       * band y 120-280 is the only quiet field, fifth-percentile luminance
       * 0.78-0.82 and texture 0.007-0.010. Below it the mountains and the
       * horse run texture 0.05-0.11 with fully dark pixels. The eyebrow, the
       * name and the date fit inside 122-265.
       */
      cap(ctx, { kz: 'СҮНДЕТ ТОЙ', ru: 'СҮНДЕТ ТОЙ' }, 122, {
        color: ctx.theme.ink,
        onPhoto: true,
        size: T.small,
      }),
      {
        type: 'text',
        props: {
          x: 6,
          y: 160,
          w: 88,
          h: 'auto',
          text: options.name ?? 'Әлихан',
          fontFamily: 'Andantino',
          fontSize: T.name,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.05,
          letterSpacing: 0,
          textShadow: GLOW,
          placeholderKey: 'heroTitle',
          editableByEndUser: true,
          editableProperties: ['text', 'color', 'fontSize'],
        },
        // Fade, not `letters`: splitting a script into one span per character
        // breaks the joins between the letters.
        animate: { type: 'fade', duration: 2.8, delay: 0.2 },
      },
      {
        type: 'text',
        props: {
          x: 15,
          y: 242,
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
// 2. Band
// ---------------------------------------------------------------------------

export function taqiyaBand(y = 12): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [band(ctx, y)],
    height: 80,
  });
}

// ---------------------------------------------------------------------------
// 3. Greeting
// ---------------------------------------------------------------------------

export function taqiyaGreeting(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      // 440, not 500: rendered, the four-line body ended ~110px above the
      // foot of a 500px plate.
      panel(ctx, 30, 440),
      medallion(ctx, 56, { x: 42, w: 16, rotation: 0, opacity: 0.85 }),
      head(ctx, { kz: 'Құрметті қонақтар!', ru: 'Дорогие гости!' }, 140),
      body(
        ctx,
        {
          kz: 'Ұлымыз Әлиханның сүндет тойына шақырамыз. Осы қуанышты күнді бізбен бірге бөлісіңіздер.',
          ru: 'Приглашаем вас на сүндет той нашего сына Әлихана. Разделите с нами этот радостный день.',
        },
        140 + 2 * HEAD_LINE + 30,
        72,
        T.body,
      ),
    ],
    height: 500,
  });
}

// ---------------------------------------------------------------------------
// 4. Takiya — the object the category is signed with
// ---------------------------------------------------------------------------

export function taqiyaObject(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      /*
       * The caption stands above the arch, on the page.
       *
       * It was first set white across the navy sleeves, which profiled flat
       * and dark. Measured on the page it failed anyway: typical contrast
       * 19.7:1, worst 2.1:1 — between the two sleeves the frame is white
       * backdrop, and a centred word crosses it. No single colour works over
       * navy and white at once, and nothing else in this frame is quiet.
       */
      {
        type: 'text',
        props: {
          x: 36,
          y: 0,
          w: 58,
          h: 'auto',
          text: t({ kz: 'Тақия', ru: 'Тақия' }, ctx),
          fontFamily: 'Andantino',
          fontSize: T.head,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: 0,
        },
        animate: { type: 'fade', duration: 2.6 },
      },
      {
        type: 'image',
        props: {
          x: 34,
          y: 62,
          w: 62,
          h: 440,
          src: A.taqiya,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskShape: 'arch',
          placeholderKey: 'coverPhoto',
          editableByEndUser: true,
          editableProperties: ['imageSrc'],
        },
        animate: { type: 'slideRight', duration: 2.9 },
      },
      medallion(ctx, 270, { x: -2, w: 30, rotation: 342, opacity: 0.5 }),
    ],
    height: 520,
  });
}

// ---------------------------------------------------------------------------
// 5. Hosts
// ---------------------------------------------------------------------------

export function taqiyaHosts(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      /*
       * The shapan as a detail, not as a boy.
       *
       * The full photograph in this oval is a child cut at the neck inside a
       * portrait frame, chin showing at the top — an oval promises a face and
       * this one delivers a collar. The source is cropped to the chest, the
       * embroidery and the belt, which removes the chin and the two-tone
       * backdrop with it.
       */
      {
        type: 'image',
        props: {
          x: 36,
          y: 30,
          w: 58,
          h: 300,
          src: A.shapan,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskShape: 'oval',
        },
        animate: { type: 'fade', duration: 2.6 },
      },
      cap(ctx, { kz: 'ТОЙ ИЕЛЕРІ', ru: 'ХОЗЯЕВА ТОЯ' }, 350, { x: 6, w: 46, align: 'left' }),
      {
        type: 'text',
        props: {
          x: 6,
          y: 386,
          w: 46,
          h: 'auto',
          text: t({ kz: 'Сейітовтер әулеті', ru: 'Семья Сейитовых' }, ctx),
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
      medallion(ctx, 470, { x: 44, w: 12, rotation: 45, opacity: 0.8 }),
    ],
    height: 530,
  });
}

// ---------------------------------------------------------------------------
// 6. Dastarkhan — a full-width strip
// ---------------------------------------------------------------------------

export function taqiyaDastarkhan(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: -5,
          y: 0,
          w: 110,
          h: 300,
          src: A.dastarkhan,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskFade: { top: 10, bottom: 24 },
        },
        animate: { type: 'fade', duration: 2.4 },
      },
      /*
       * The type sits on the empty cloth, which the prompt asked for and the
       * frame delivered: y 0-100 of this 429 by 300 box runs fifth-percentile
       * luminance 0.92 at texture 0.018. The top 10% fades into the page, so
       * nothing starts above 30.
       */
      cap(ctx, { kz: 'ТОЙ ДАСТАРХАНЫ', ru: 'ПРАЗДНИЧНЫЙ СТОЛ' }, 30, {
        color: ctx.theme.ink,
        onPhoto: true,
      }),
      {
        type: 'text',
        props: {
          x: 8,
          y: 56,
          w: 84,
          h: 'auto',
          text: t({ kz: 'Ақ дастарханға қош келіңіз', ru: 'Добро пожаловать к столу' }, ctx),
          fontFamily: 'Cormorant',
          fontSize: T.lead,
          fontWeight: 500,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: 0.3,
          textShadow: GLOW,
        },
        animate: { type: 'slideLeft', duration: 2.6 },
      },
    ],
    height: 320,
  });
}

// ---------------------------------------------------------------------------
// 7. When
// ---------------------------------------------------------------------------

export function taqiyaWhen(options: { targetIso: string }): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      medallion(ctx, 110, { x: 26, w: 48, rotation: 0, opacity: 0.12, spin: true }),
      head(ctx, { kz: 'Өтетін күні', ru: 'Дата торжества' }, 30),
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
// 8. Location
// ---------------------------------------------------------------------------

export function taqiyaLocation(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Мекен-жайы', ru: 'Адрес' }, 30),
      body(
        ctx,
        { kz: 'Алматы, «Алтын Орда» мейрамханасы', ru: 'Алматы, ресторан «Алтын Орда»' },
        106,
        72,
        T.body,
      ),
      {
        type: 'map',
        props: {
          x: 10,
          y: 190,
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
    height: 540,
  });
}

// ---------------------------------------------------------------------------
// 9. RSVP
// ---------------------------------------------------------------------------

export function taqiyaRsvp(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      // 700: rendered, the button ended ~110px above a 760px plate; 50 of that
      // is kept for the guest-count field that opens under «Серіктесіммен».
      panel(ctx, 20, 700),
      // On the plate's corner, not hung off the page: see «Сәукеле».
      {
        type: 'image',
        props: {
          x: 75,
          y: 27,
          w: 18,
          h: 70,
          rotation: 90,
          src: A.corner,
          alt: '',
          objectFit: 'contain',
          borderRadius: 0,
          tint: gold(ctx),
          opacity: 0.5,
        },
        animate: false,
      },
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
    height: 760,
  });
}

// ---------------------------------------------------------------------------
// 10. Wishes
// ---------------------------------------------------------------------------

export function taqiyaWishes(): SectionBuilder {
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
// 11. Closing
// ---------------------------------------------------------------------------

export function taqiyaClosing(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      band(ctx, 16),
      medallion(ctx, 100, { x: 22, w: 56, rotation: 0, opacity: 0.14 }),
      body(
        ctx,
        {
          kz: 'Тойымыздың қадірлі қонағы болыңыздар!',
          ru: 'Будьте дорогими гостями нашего тоя!',
        },
        190,
        70,
        T.body,
      ),
      corner(ctx, 280, { side: 'left', w: 26, opacity: 0.4, flipY: true }),
      corner(ctx, 280, { side: 'right', w: 26, opacity: 0.4, flipY: true }),
    ],
    height: 400,
  });
}
