/**
 * Sections for «Мерей» — мерейтой, second build.
 *
 * The first build passed the gate 31/31 and the owner called it much worse
 * than the three before it: ugly fonts, flush-left type, the default programme
 * look, cramped text in the embossed card, wide letterspacing, and a dull
 * stack of full-width photographs. Nine toi pages were then captured whole
 * (design-vocabulary.md §3.23), and this build follows what they share:
 *
 *  - one centred axis. The only things off it are deliberate pairs — the day
 *    and the month either side of the axis, the time and the calendar button —
 *    so the page stays symmetrical while the gate's off-axis checks hold;
 *  - Balmoral, the competitors' second script, for every heading and the name;
 *    Cormorant for reading; Montserrat caps at the gate's 15px floor with 1.5px
 *    of tracking, never the 4-12px that broke words apart;
 *  - the hero as a composition in the order toi's мерейтой 14 uses — caption,
 *    name, numeral, «жас», invitation, date — each on its own line;
 *  - text held inside something: the blind-embossed ою frame with real room
 *    inside it, a white card for the answer form, a wine band for the countdown;
 *  - photographs framed rather than stacked: the tray in an arch, the hall in a
 *    rounded frame with a gold outline stepped out from it, the silk returning
 *    washed behind the form and turned round under the closing words;
 *  - the programme as a zigzag with a flake of gold leaf flying it.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };
const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

const A = {
  heroVideo: '/assets/templates/merei/hero.webm',
  heroPoster: '/assets/templates/merei/hero-poster.webp',
  emboss: '/assets/templates/merei/story-emboss.webp',
  tray: '/assets/templates/merei/story-tray.webp',
  hall: '/assets/templates/merei/story-hall.webp',
  leaf: '/assets/templates/merei/cut-leaf-b.webp',
} as const;

/** 15 / 18 / 24 / 40 / 64 / 100 / 150. */
const T = {
  caps: 15,
  body: 18,
  lead: 24,
  head: 40,
  name: 64,
  day: 100,
  numeral: 150,
} as const;

const GOLD = '#A8844A';
const CREAM = '#FFF8F0';

/** The pair centres either side of the axis. */
const PAIR = { left: 30, right: 70 } as const;

const GLOW = { x: 0, y: 2, blur: 10, color: 'rgba(255,255,255,0.75)' } as const;
const GLOW_TIGHT = { x: 0, y: 1, blur: 4, color: 'rgba(255,255,255,0.9)' } as const;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function caps(
  ctx: SectionContext,
  copy: Copy,
  y: number,
  opts: { color?: string; glow?: boolean; x?: number; w?: number } = {},
): ElementSpec {
  return {
    type: 'text',
    props: {
      x: opts.x ?? 10,
      y,
      w: opts.w ?? 80,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Montserrat',
      fontSize: T.caps,
      fontWeight: 600,
      color: opts.color ?? ctx.theme.muted,
      textAlign: 'center',
      lineHeight: 1.4,
      letterSpacing: 1.5,
      uppercase: true,
      ...(opts.glow ? { textShadow: GLOW_TIGHT } : {}),
    },
    animate: { type: 'fade', duration: 2.4 },
  };
}

function head(
  ctx: SectionContext,
  copy: Copy,
  y: number,
  opts: { x?: number; w?: number; size?: number; color?: string; glow?: boolean } = {},
): ElementSpec {
  return {
    type: 'text',
    props: {
      x: opts.x ?? 8,
      y,
      w: opts.w ?? 84,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Balmoral',
      fontSize: opts.size ?? T.head,
      fontWeight: 400,
      color: opts.color ?? ctx.theme.ink,
      textAlign: 'center',
      lineHeight: 1.15,
      letterSpacing: 0,
      ...(opts.glow ? { textShadow: GLOW } : {}),
    },
    animate: { type: 'fade', duration: 2.6 },
  };
}

function body(
  ctx: SectionContext,
  copy: Copy,
  y: number,
  opts: { x?: number; w?: number; size?: number } = {},
): ElementSpec {
  const w = opts.w ?? 72;
  return {
    type: 'text',
    props: {
      x: opts.x ?? (100 - w) / 2,
      y,
      w,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Cormorant',
      fontSize: opts.size ?? T.body,
      fontWeight: 500,
      color: ctx.theme.ink,
      textAlign: 'center',
      lineHeight: 1.55,
      letterSpacing: 0,
    },
    animate: { type: 'fadeUp', duration: 2.4 },
  };
}

/**
 * The blind-embossed ою sheet as a frame.
 *
 * Its border runs about 17% in from each side of the file, so at 94% of the
 * page the free inside is x 19-81. Text is set in x 23-77 — the first build set
 * it flush against the relief and the owner called the words cramped.
 */
function embossFrame(y: number, h: number, rotation = 0): ElementSpec {
  return {
    type: 'image',
    props: {
      x: 3,
      y,
      w: 94,
      h,
      src: A.emboss,
      alt: '',
      objectFit: 'cover',
      borderRadius: 0,
      rotation,
    },
    animate: { type: 'fade', duration: 2.2 },
  };
}

/** The silk of the hero, washed, under a later section. */
function silk(y: number, h: number, opts: { rotation?: number; opacity?: number } = {}): ElementSpec {
  return {
    type: 'image',
    props: {
      x: -5,
      y,
      w: 110,
      h,
      src: A.heroPoster,
      alt: '',
      objectFit: 'cover',
      borderRadius: 0,
      rotation: opts.rotation ?? 0,
      opacity: opts.opacity ?? 0.55,
      maskFade: { top: 16, bottom: 16 },
    },
    animate: false,
  };
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------

export function mereiHero(options: { name?: string; age?: string } = {}): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: -8,
          y: 0,
          w: 116,
          h: 720,
          src: A.heroPoster,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskFade: { bottom: 16 },
        },
        animate: { type: 'fade', duration: 2.0 },
      },
      {
        type: 'video-bg',
        props: {
          x: -8,
          y: 0,
          w: 116,
          h: 720,
          src: A.heroVideo,
          posterSrc: A.heroPoster,
          loop: true,
          opacity: 1,
          maskFade: { bottom: 16 },
        },
      },
      // One flake of the same leaf that falls in the clip, drifting at the edge.
      {
        type: 'image',
        props: {
          x: 82,
          y: 96,
          w: 24,
          h: 94,
          src: A.leaf,
          alt: '',
          objectFit: 'contain',
          borderRadius: 0,
          rotation: 24,
          idle: { type: 'float', duration: 8 },
        },
        animate: { type: 'fade', duration: 3.0 },
      },
      /*
       * One line per role, nothing laid over anything. The first build ran the
       * name across the top of the numeral and the owner read the two as stuck
       * together. The smooth silk measured y 240-520; the block spans 150-535.
       */
      caps(ctx, { kz: 'Мерейлі', ru: 'Юбилей' }, 150, { color: ctx.theme.ink, glow: true }),
      {
        type: 'text',
        props: {
          x: 6,
          y: 176,
          w: 88,
          h: 'auto',
          text: options.name ?? 'Серіктің',
          fontFamily: 'Balmoral',
          fontSize: T.name,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: 0,
          textShadow: GLOW,
          placeholderKey: 'heroTitle',
          editableByEndUser: true,
          editableProperties: ['text', 'color', 'fontSize'],
        },
        animate: { type: 'fade', duration: 2.8, delay: 0.1 },
      },
      {
        type: 'text',
        props: {
          x: 6,
          y: 250,
          w: 88,
          h: 'auto',
          text: options.age ?? '60',
          fontFamily: 'Cormorant',
          fontSize: T.numeral,
          fontWeight: 700,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1,
          letterSpacing: -3,
          editableByEndUser: true,
          editableProperties: ['text'],
        },
        animate: { type: 'fade', duration: 3.0, delay: 0.3 },
      },
      caps(ctx, { kz: 'Жас', ru: 'Лет' }, 404, { color: ctx.theme.ink, glow: true }),
      head(ctx, { kz: 'мерейтойына шақырамыз', ru: 'приглашаем на юбилей' }, 440, { glow: true }),
      {
        type: 'text',
        props: {
          x: 15,
          y: 504,
          w: 70,
          h: 'auto',
          text: '15 . 05 . 2027',
          fontFamily: 'Cormorant',
          fontSize: T.body,
          fontWeight: 600,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: 2,
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
// 2. Greeting — inside the embossed frame
// ---------------------------------------------------------------------------

export function mereiGreeting(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      embossFrame(20, 490),
      head(ctx, { kz: 'Құрметті\nқонақтар!', ru: 'Дорогие\nгости!' }, 104, { x: 23, w: 54 }),
      body(
        ctx,
        {
          kz: 'Әкеміз Серіктің 60 жасқа толу мерейтойына шақырамыз.',
          ru: 'Приглашаем вас на 60-летний юбилей нашего отца Серика.',
        },
        214,
        { x: 23, w: 54 },
      ),
      head(ctx, { kz: 'балалары', ru: 'дети' }, 344, { x: 23, w: 54, size: T.head }),
    ],
    height: 520,
  });
}

// ---------------------------------------------------------------------------
// 3. Hosts — the tray in an arch
// ---------------------------------------------------------------------------

export function mereiHosts(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: 17,
          y: 20,
          w: 66,
          h: 360,
          src: A.tray,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskShape: 'arch',
          placeholderKey: 'coverPhoto',
          editableByEndUser: true,
          editableProperties: ['imageSrc'],
        },
        animate: { type: 'fade', duration: 2.6 },
      },
      head(ctx, { kz: 'Балалары мен немерелері', ru: 'Дети и внуки' }, 398),
    ],
    height: 460,
  });
}

// ---------------------------------------------------------------------------
// 4. Programme — zigzag, gold leaf flying it
// ---------------------------------------------------------------------------

export function mereiProgram(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Кеш бағдарламасы', ru: 'Программа вечера' }, 40),
      {
        type: 'program',
        props: {
          x: 8,
          y: 116,
          w: 84,
          h: 480,
          variant: 'zigzag',
          fontFamily: 'Cormorant',
          fontSize: T.body,
          timeFontFamily: 'Balmoral',
          timeSize: 40,
          rowHeight: 120,
          markerSize: 10,
          markerColor: GOLD,
          lineColor: GOLD,
          travellerSrc: A.leaf,
          travellerSize: 40,
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: GOLD,
          timeColor: ctx.theme.ink,
          items: [
            { id: 'guests', time: '17:00', title: t({ kz: 'Қонақтарды қарсы алу', ru: 'Встреча гостей' }, ctx) },
            { id: 'toi', time: '18:00', title: t({ kz: 'Мерейтой салтанаты', ru: 'Торжество' }, ctx) },
            { id: 'concert', time: '20:00', title: t({ kz: 'Концерттік бағдарлама', ru: 'Концерт' }, ctx) },
            { id: 'cake', time: '22:00', title: t({ kz: 'Мерейтой торты', ru: 'Юбилейный торт' }, ctx) },
          ],
        },
        animate: { type: 'fade', duration: 2.4 },
      },
    ],
    height: 610,
  });
}

// ---------------------------------------------------------------------------
// 5. When — day and month either side of the axis, the calendar in a card
// ---------------------------------------------------------------------------

export function mereiWhen(options: { targetIso: string }): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Мерейтой күні', ru: 'Дата юбилея' }, 10),
      {
        type: 'text',
        props: {
          x: PAIR.left - 20,
          y: 76,
          w: 40,
          h: 'auto',
          text: '15',
          fontFamily: 'Cormorant',
          fontSize: T.day,
          fontWeight: 700,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1,
          letterSpacing: -1,
        },
        animate: { type: 'slideLeft', duration: 2.6 },
      },
      {
        type: 'text',
        props: {
          x: PAIR.right - 20,
          y: 94,
          w: 40,
          h: 'auto',
          text: t({ kz: 'мамыр\n2027', ru: 'мая\n2027' }, ctx),
          fontFamily: 'Cormorant',
          fontSize: T.lead,
          fontWeight: 600,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.25,
          letterSpacing: 0,
        },
        animate: { type: 'slideRight', duration: 2.6 },
      },
      {
        type: 'text',
        props: {
          x: PAIR.left - 20,
          y: 196,
          w: 40,
          h: 'auto',
          text: t({ kz: 'сағат 18:00', ru: 'в 18:00' }, ctx),
          fontFamily: 'Cormorant',
          fontSize: T.lead,
          fontWeight: 500,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: 0,
        },
        animate: { type: 'fade', duration: 2.4 },
      },
      {
        type: 'button',
        props: {
          x: PAIR.right - 21,
          y: 190,
          w: 42,
          h: 44,
          label: t({ kz: 'Күнтізбеге қосу', ru: 'В календарь' }, ctx),
          action: { kind: 'calendar' },
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          borderColor: GOLD,
          borderWidth: 1,
          fontFamily: 'Cormorant',
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 999,
        },
        animate: { type: 'fade', duration: 2.4 },
      },
      {
        type: 'shape',
        props: {
          x: 6,
          y: 262,
          w: 88,
          h: 390,
          shape: 'rect',
          fill: 'rgba(255,255,255,0.78)',
          radius: 24,
          stroke: 'transparent',
          strokeWidth: 0,
          shadow: { x: 0, y: 12, blur: 30, color: 'rgba(90,26,38,0.08)' },
        },
        animate: false,
      },
      {
        type: 'calendar',
        props: {
          x: 12,
          y: 284,
          w: 76,
          h: 350,
          targetIso: options.targetIso,
          accentColor: ctx.theme.accent,
          color: ctx.theme.ink,
          fontFamily: 'Cormorant',
          fontSize: 16,
          markStyle: 'fill',
        },
        animate: { type: 'fade', duration: 2.6 },
      },
    ],
    height: 680,
  });
}

// ---------------------------------------------------------------------------
// 6. Countdown — a wine band, the one saturated pause on the page
// ---------------------------------------------------------------------------

export function mereiCountdown(options: { targetIso: string }): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'shape',
        props: {
          x: -2,
          y: 0,
          w: 104,
          h: 160,
          shape: 'rect',
          fill: ctx.theme.ink,
          radius: 0,
          stroke: 'transparent',
          strokeWidth: 0,
        },
        animate: false,
      },
      caps(ctx, { kz: 'Мерейтойға дейін', ru: 'До юбилея' }, 24, { color: GOLD }),
      {
        type: 'countdown',
        props: {
          x: 8,
          y: 58,
          w: 84,
          h: 90,
          targetIso: options.targetIso,
          color: CREAM,
          accentColor: GOLD,
          fontFamily: 'Cormorant',
          fontSize: 36,
        },
        animate: { type: 'fade', duration: 2.6 },
      },
    ],
    height: 200,
  });
}

// ---------------------------------------------------------------------------
// 7. Location — the hall in a rounded frame with a stepped gold outline
// ---------------------------------------------------------------------------

export function mereiLocation(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Мекен-жайы', ru: 'Место' }, 10),
      body(ctx, { kz: '«Алтын Орда» мейрамханасы, Алматы', ru: 'Ресторан «Алтын Орда», Алматы' }, 70, {
        size: T.lead,
        w: 84,
      }),
      {
        type: 'shape',
        props: {
          x: 5,
          y: 138,
          w: 90,
          h: 372,
          shape: 'rect',
          fill: 'transparent',
          radius: 32,
          stroke: GOLD,
          strokeWidth: 1,
        },
        animate: false,
      },
      {
        type: 'image',
        props: {
          x: 9,
          y: 152,
          w: 82,
          h: 344,
          src: A.hall,
          alt: '',
          objectFit: 'cover',
          borderRadius: 24,
        },
        animate: { type: 'fade', duration: 2.6 },
      },
      {
        type: 'map',
        props: {
          x: 10,
          y: 540,
          w: 80,
          h: 220,
          address: '',
          markerTitle: '',
          showStaticOnly: false,
          accentColor: ctx.theme.accent,
          textColor: ctx.theme.ink,
          bgColor: '#FFFFFF',
          fontFamily: 'Cormorant',
          placeholderKey: 'venueAddress',
          editableByEndUser: true,
          editableProperties: ['text'],
        },
        animate: { type: 'fade', duration: 2.6 },
      },
    ],
    height: 790,
  });
}

// ---------------------------------------------------------------------------
// 8. RSVP — a white card on washed silk
// ---------------------------------------------------------------------------

export function mereiRsvp(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      silk(0, 620, { opacity: 0.5 }),
      {
        type: 'shape',
        props: {
          x: 6,
          y: 30,
          w: 88,
          // 560: at 620 the card ran 140px of empty white under the button.
          h: 560,
          shape: 'rect',
          fill: 'rgba(255,255,255,0.82)',
          radius: 24,
          stroke: 'transparent',
          strokeWidth: 0,
          shadow: { x: 0, y: 14, blur: 34, color: 'rgba(90,26,38,0.10)' },
        },
        animate: false,
      },
      head(ctx, { kz: 'Қатысуыңызды растаңыз', ru: 'Подтвердите присутствие' }, 70, { x: 14, w: 72 }),
      {
        type: 'rsvp-form',
        props: {
          x: 12,
          y: 140,
          w: 76,
          h: 480,
          fontFamily: 'Cormorant',
          title: '',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          askPlusOne: true,
          askDietary: false,
        },
        animate: { type: 'fadeUp', duration: 2.2 },
      },
    ],
    height: 620,
  });
}

// ---------------------------------------------------------------------------
// 9. Wishes — inside the embossed frame, turned
// ---------------------------------------------------------------------------

export function mereiWishes(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      embossFrame(20, 490, 180),
      head(ctx, { kz: 'Ізгі тілектер', ru: 'Пожелания' }, 110, { x: 23, w: 54 }),
      {
        type: 'wishes',
        props: {
          x: 21,
          y: 170,
          w: 58,
          h: 280,
          title: '',
          fontFamily: 'Cormorant',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          allowAnonymous: true,
        },
        animate: { type: 'fade', duration: 2.4 },
      },
    ],
    height: 540,
  });
}

// ---------------------------------------------------------------------------
// 10. Closing — on the silk, turned
// ---------------------------------------------------------------------------

export function mereiClosing(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      silk(0, 480, { rotation: 180, opacity: 0.7 }),
      head(ctx, { kz: 'Қадірлі қонағымыз\nболыңыздар!', ru: 'Будьте нашими\nдорогими гостями!' }, 170, { glow: true }),
      body(ctx, { kz: 'Құрметпен,\nСеріктің балалары', ru: 'С уважением,\nдети Серика' }, 296, { size: T.lead }),
    ],
    height: 480,
  });
}
