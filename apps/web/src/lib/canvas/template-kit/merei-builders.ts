/**
 * Sections for «Мерей» — мерейтой.
 *
 * The owner's brief after «Жұпар»: another template, with the small things
 * done differently — no medallion, no corner ornaments, no dividers, and type
 * set some other way. The skeleton and every measured device stay; these go:
 *
 *  - the tinted ою medallion, corner and band. In their place, photographed
 *    gold leaf (cut out, floating), a photographed torn paper edge where a
 *    photograph meets the paper, and a single hairline outline round the
 *    RSVP instead of a plate with corners;
 *  - Kazakh ornament as material rather than as a sticker: blind-embossed ою
 *    under the greeting, gold keste embroidery as a strip;
 *  - centred type. The hero is the category's own convention at toi — a giant
 *    age numeral with the name in script riding over its top — and the section
 *    headings below it are set flush left (toi: 44 of 53). The date is set as
 *    three big lines with their labels beside them, and one caption runs up the
 *    left edge, the only device here without a competitor measurement.
 *
 * Anchors. The gate allows three or four content centres and the music dial
 * takes 84, so everything off the axis sits on 31 (hosts, date) or 69 (date
 * labels); anything decorative that would add a fifth centre bleeds off a page
 * edge instead.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };
const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

const A = {
  heroVideo: '/assets/templates/merei/hero.webm',
  heroPoster: '/assets/templates/merei/hero-poster.webp',
  emboss: '/assets/templates/merei/story-emboss.webp',
  tray: '/assets/templates/merei/story-tray.webp',
  keste: '/assets/templates/merei/story-keste.webp',
  hall: '/assets/templates/merei/story-hall.webp',
  torn: '/assets/templates/merei/cut-torn.webp',
  leafA: '/assets/templates/merei/cut-leaf-a.webp',
  leafB: '/assets/templates/merei/cut-leaf-b.webp',
} as const;

/**
 * 15 / 18 / 20 / 27 / 42 / 56 / 60 / 200. The one enormous step, 60 to 200,
 * is the point of the hero; everything else keeps the scale the gate knows.
 */
const T = {
  cap: 15,
  small: 18,
  body: 20,
  lead: 27,
  head: 42,
  date: 56,
  name: 60,
  // 200 is the canvas schema's ceiling for a text size; 220 was rejected.
  numeral: 200,
} as const;

const HEAD_LINE = 50;

const GLOW = { x: 0, y: 2, blur: 9, color: 'rgba(255,255,255,0.8)' } as const;
const GLOW_TIGHT = { x: 0, y: 1, blur: 4, color: 'rgba(255,255,255,0.95)' } as const;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function cap(
  ctx: SectionContext,
  copy: Copy,
  y: number,
  opts: { color?: string; onPhoto?: boolean; size?: number; x?: number; w?: number; align?: 'left' | 'center'; spacing?: number } = {},
): ElementSpec {
  return {
    type: 'text',
    props: {
      x: opts.x ?? 10,
      y,
      w: opts.w ?? 80,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Monolog',
      fontSize: opts.size ?? T.cap,
      fontWeight: 500,
      color: opts.color ?? ctx.theme.muted,
      textAlign: opts.align ?? 'center',
      lineHeight: 1.4,
      letterSpacing: opts.spacing ?? 4,
      ...(opts.onPhoto ? { textShadow: GLOW_TIGHT } : {}),
    },
    animate: { type: 'fade', duration: 2.4 },
  };
}

/** A heading flush left in its column. */
function head(ctx: SectionContext, copy: Copy, y: number, x = 8, w = 84): ElementSpec {
  return {
    type: 'text',
    props: {
      x,
      y,
      w,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Oranienbaum',
      fontSize: T.head,
      fontWeight: 400,
      color: ctx.theme.ink,
      textAlign: 'left',
      lineHeight: 1.18,
      letterSpacing: 0,
    },
    animate: { type: 'slideLeft', duration: 2.7 },
  };
}

function body(
  ctx: SectionContext,
  copy: Copy,
  y: number,
  opts: { x?: number; w?: number; size?: number; align?: 'left' | 'center' } = {},
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
      fontFamily: 'Monolog',
      fontSize: opts.size ?? T.body,
      fontWeight: 400,
      color: ctx.theme.ink,
      textAlign: opts.align ?? 'left',
      lineHeight: 1.7,
      letterSpacing: 0,
    },
    animate: { type: 'slideRight', duration: 2.6 },
  };
}

/**
 * A flake of real gold leaf, in its own colour.
 *
 * Decorative placements hang past a page edge so the gate counts them as bleed
 * rather than as a content centre. `float` is the looping motion that replaces
 * the turning medallion of the last three templates.
 */
function leaf(
  y: number,
  opts: { which: 'a' | 'b'; x: number; w: number; rotation?: number; float?: number; still?: boolean },
): ElementSpec {
  return {
    type: 'image',
    props: {
      x: opts.x,
      y,
      w: opts.w,
      h: Math.round((opts.w / 100) * 390),
      src: opts.which === 'a' ? A.leafA : A.leafB,
      alt: '',
      objectFit: 'contain',
      borderRadius: 0,
      rotation: opts.rotation ?? 0,
      ...(opts.float ? { idle: { type: 'float', duration: opts.float } } : {}),
    },
    animate: opts.still ? false : { type: 'fade', duration: 2.4 },
  };
}

/**
 * The photographed torn edge laid across one end of a photograph, so the
 * picture reads as lying behind a torn sheet of the page's own paper.
 *
 * The tear always points INTO the photograph and the straight edge lies on the
 * page. The file is paper above a torn lower edge, so it goes on unturned at a
 * photograph's head and turned half round at its foot. The first build had
 * that reversed: each edge showed as a separate cream band with its tear
 * facing the page.
 *
 * It is also graded to the page, and measured on the page, not guessed. The
 * paper in the scan is luma 236 and warm; the ground renders at 240. A first
 * guess of brightness 112% put the strip at 255 — a white band 15 levels
 * above the page. 102% with saturation at 45% lands on the ground.
 *
 * Page width exactly: the gate caps the share of images wider than the page,
 * and the photographs already take that share.
 */
function torn(photoEdgeY: number, end: 'head' | 'foot'): ElementSpec {
  return {
    type: 'image',
    props: {
      x: 0,
      y: end === 'head' ? photoEdgeY - 8 : photoEdgeY - 44,
      w: 100,
      h: 52,
      src: A.torn,
      alt: '',
      objectFit: 'fill',
      borderRadius: 0,
      grade: { brightness: 102, saturate: 45 },
      ...(end === 'foot' ? { rotation: 180 } : {}),
    },
    animate: false,
  };
}

// ---------------------------------------------------------------------------
// 1. Hero — the numeral
// ---------------------------------------------------------------------------

export function mereiHero(options: { name?: string; age?: string } = {}): SectionBuilder {
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
      leaf(64, { which: 'a', x: 88, w: 18, rotation: 20, float: 7 }),
      leaf(540, { which: 'b', x: -6, w: 13, rotation: -25, still: true }),
      /*
       * Wine, not gold. The silk under the numeral profiles smooth but
       * mid-grey — mean luminance 0.58-0.62 at texture 0.003-0.005 in y
       * 240-520 — so gold type measured about 2:1 there and the wine ink
       * about 8:1. The gold stays in the leaf that falls past it.
       */
      cap(ctx, { kz: 'МЕРЕЙТОЙҒА ШАҚЫРУ', ru: 'ПРИГЛАШЕНИЕ НА ЮБИЛЕЙ' }, 104, {
        color: ctx.theme.ink,
        onPhoto: true,
        spacing: 5,
      }),
      {
        type: 'text',
        props: {
          x: 6,
          y: 196,
          w: 88,
          h: 'auto',
          text: options.age ?? '60',
          fontFamily: 'Oranienbaum',
          fontSize: T.numeral,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 0.9,
          letterSpacing: 0,
          // No glow: at 200px the white halo read as a pink rim round the
          // figures. Without it the numeral still measures 7:1 on the silk.
          editableByEndUser: true,
          editableProperties: ['text'],
        },
        animate: { type: 'fade', duration: 3.0, delay: 0.3 },
      },
      /*
       * Type on type. The name is placed after the numeral so it sits above it,
       * and low enough that its baseline runs across the top of the figures.
       */
      {
        type: 'text',
        props: {
          x: 6,
          y: 162,
          w: 88,
          h: 'auto',
          text: options.name ?? 'Серіктің',
          fontFamily: 'Shelley',
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
        animate: { type: 'slideLeft', duration: 2.8, delay: 0.1 },
      },
      cap(ctx, { kz: 'ЖАС', ru: 'ЛЕТ' }, 384, {
        color: ctx.theme.ink,
        onPhoto: true,
        size: T.small,
        spacing: 12,
      }),
      {
        type: 'text',
        props: {
          x: 15,
          y: 430,
          w: 70,
          h: 'auto',
          text: '15 . 05 . 2027',
          fontFamily: 'Monolog',
          fontSize: T.small,
          fontWeight: 500,
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
// 2. Greeting — on blind-embossed paper
// ---------------------------------------------------------------------------

export function mereiGreeting(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: 4,
          y: 20,
          w: 92,
          h: 480,
          src: A.emboss,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
        },
        animate: { type: 'fade', duration: 2.4 },
      },
      // Inside the embossed border: the relief occupies about 12% of each side.
      head(ctx, { kz: 'Құрметті қонақтар!', ru: 'Дорогие гости!' }, 110, 20, 60),
      body(
        ctx,
        {
          kz: 'Әкеміз Серіктің 60 жасқа толу мерейтойына шақырамыз. Қуанышымызды бірге бөлісейік.',
          ru: 'Приглашаем вас на 60-летний юбилей нашего отца Серика. Разделите с нами эту радость.',
        },
        110 + 2 * HEAD_LINE + 26,
        { x: 20, w: 60 },
      ),
    ],
    height: 540,
  });
}

// ---------------------------------------------------------------------------
// 3. Hosts — the tray between two torn edges, the names hung left
// ---------------------------------------------------------------------------

export function mereiHosts(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: 0,
          y: 40,
          w: 100,
          h: 420,
          src: A.tray,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          placeholderKey: 'coverPhoto',
          editableByEndUser: true,
          editableProperties: ['imageSrc'],
        },
        animate: { type: 'fade', duration: 2.6 },
      },
      torn(40, 'head'),
      torn(40 + 420, 'foot'),
      // The quiet silk above the tray: y 0-100 of the photograph measured
      // fifth-percentile luminance 0.92 at texture 0.018.
      cap(ctx, { kz: 'ТОЙ ИЕЛЕРІ', ru: 'ХОЗЯЕВА ТОЯ' }, 96, {
        x: 6,
        w: 50,
        align: 'left',
        color: ctx.theme.ink,
        onPhoto: true,
      }),
      {
        type: 'text',
        props: {
          x: 6,
          y: 486,
          w: 50,
          h: 'auto',
          text: t({ kz: 'Балалары мен немерелері', ru: 'Дети и внуки' }, ctx),
          fontFamily: 'Oranienbaum',
          fontSize: T.lead,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'left',
          lineHeight: 1.25,
          letterSpacing: 0,
          placeholderKey: 'heroSubtitle',
          editableByEndUser: true,
          editableProperties: ['text'],
        },
        animate: { type: 'slideLeft', duration: 2.6 },
      },
    ],
    height: 560,
  });
}

// ---------------------------------------------------------------------------
// 4. Keste — a strip of gold embroidery
// ---------------------------------------------------------------------------

export function mereiKeste(): SectionBuilder {
  return (): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          // 116%: 31px past each edge, the page's widest bleed.
          x: -8,
          y: 10,
          w: 116,
          h: 180,
          src: A.keste,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskFade: { top: 14, bottom: 14 },
        },
        animate: { type: 'fade', duration: 2.4 },
      },
    ],
    height: 200,
  });
}

// ---------------------------------------------------------------------------
// 5. Programme — a plain rail, and a caption up the left edge
// ---------------------------------------------------------------------------

export function mereiProgram(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      leaf(20, { which: 'b', x: 92, w: 12, rotation: 40, float: 9 }),
      head(ctx, { kz: 'Кеш бағдарламасы', ru: 'Программа вечера' }, 20, 10, 80),
      {
        type: 'program',
        props: {
          x: 10,
          y: 140,
          w: 80,
          h: 250,
          variant: 'rail',
          fontFamily: 'Monolog',
          fontSize: 18,
          iconSize: 0,
          markerSize: 8,
          lineColor: 'rgba(90,26,38,0.35)',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          timeColor: ctx.theme.muted,
          items: [
            { id: 'guests', time: '17:00', title: t({ kz: 'Қонақтарды қарсы алу', ru: 'Встреча гостей' }, ctx) },
            { id: 'toi', time: '18:00', title: t({ kz: 'Мерейтой салтанаты', ru: 'Торжество' }, ctx) },
            { id: 'concert', time: '20:00', title: t({ kz: 'Концерттік бағдарлама', ru: 'Концертная программа' }, ctx) },
            { id: 'cake', time: '22:00', title: t({ kz: 'Мерейтой торты', ru: 'Юбилейный торт' }, ctx) },
          ],
        },
        animate: { type: 'fadeUp', duration: 2.2 },
      },
      /*
       * The one unmeasured device: a letterspaced caption turned up the left
       * edge. Centred at 4% so it bleeds past the page and does not become a
       * content centre; the programme's rail starts 55px in, clear of it.
       */
      {
        type: 'text',
        props: {
          x: -16,
          y: 250,
          w: 40,
          h: 'auto',
          text: t({ kz: 'МЕРЕЙ · 60', ru: 'ЮБИЛЕЙ · 60' }, ctx),
          fontFamily: 'Monolog',
          fontSize: T.cap,
          fontWeight: 500,
          color: ctx.theme.muted,
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: 8,
          rotation: 270,
        },
        animate: false,
      },
    ],
    height: 400,
  });
}

// ---------------------------------------------------------------------------
// 6. When — the date in three big lines, the calendar, add-to-calendar
// ---------------------------------------------------------------------------

export function mereiWhen(options: { targetIso: string }): SectionBuilder {
  // One line of the date, so the labels beside it share its line boxes.
  const line = T.date * 1.2;
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Мерейтой күні', ru: 'Дата юбилея' }, 20, 6, 88),
      // Right of the heading: at the left edge it landed on the «1» of 15.
      leaf(58, { which: 'a', x: 90, w: 14, rotation: 15, still: true }),
      {
        type: 'text',
        props: {
          x: 6,
          y: 100,
          w: 50,
          h: 'auto',
          text: '15\n05\n2027',
          fontFamily: 'Oranienbaum',
          fontSize: T.date,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'left',
          lineHeight: 1.2,
          letterSpacing: 1,
        },
        animate: { type: 'slideLeft', duration: 2.6 },
      },
      {
        type: 'text',
        props: {
          x: 46,
          y: 100,
          w: 46,
          h: 'auto',
          text: t({ kz: 'КҮНІ\nАЙЫ\nЖЫЛЫ', ru: 'ДЕНЬ\nМЕСЯЦ\nГОД' }, ctx),
          fontFamily: 'Monolog',
          fontSize: T.cap,
          fontWeight: 500,
          color: ctx.theme.muted,
          textAlign: 'left',
          lineHeight: line / T.cap,
          letterSpacing: 4,
        },
        animate: { type: 'slideRight', duration: 2.6 },
      },
      {
        type: 'calendar',
        props: {
          x: 12,
          y: 330,
          w: 76,
          h: 350,
          targetIso: options.targetIso,
          accentColor: ctx.theme.accent,
          color: ctx.theme.ink,
          fontFamily: 'Monolog',
          fontSize: 14,
          markStyle: 'fill',
        },
        animate: { type: 'revealUp', duration: 2.6 },
      },
      /*
       * Add to the phone's calendar. The engine has served an .ics for every
       * published invitation all along and no template had ever placed the
       * button that asks for it.
       */
      {
        type: 'button',
        props: {
          x: 22,
          y: 700,
          w: 56,
          h: 50,
          label: t({ kz: 'Күнтізбеге қосу', ru: 'Добавить в календарь' }, ctx),
          action: { kind: 'calendar' },
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          borderColor: ctx.theme.ink,
          borderWidth: 1,
          fontFamily: 'Monolog',
          fontSize: 16,
          fontWeight: 500,
          borderRadius: 999,
        },
        animate: { type: 'fadeUp', duration: 2.2 },
      },
      {
        type: 'countdown',
        props: {
          x: 8,
          y: 772,
          w: 84,
          h: 100,
          targetIso: options.targetIso,
          color: ctx.theme.ink,
          accentColor: ctx.theme.muted,
          fontFamily: 'Oranienbaum',
          fontSize: 28,
        },
        animate: { type: 'fade', duration: 2.8 },
      },
    ],
    height: 880,
  });
}

// ---------------------------------------------------------------------------
// 7. Location — the hall, ending in a torn edge
// ---------------------------------------------------------------------------

export function mereiLocation(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: -5,
          y: 0,
          w: 110,
          h: 460,
          src: A.hall,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskFade: { top: 8 },
        },
        animate: { type: 'fade', duration: 2.4 },
      },
      torn(460, 'foot'),
      cap(ctx, { kz: 'МЕКЕН-ЖАЙЫ', ru: 'АДРЕС' }, 44, { x: 8, w: 84, align: 'left', color: ctx.theme.ink, onPhoto: true }),
      {
        type: 'text',
        props: {
          x: 8,
          y: 72,
          w: 84,
          h: 'auto',
          text: t({ kz: '«Алтын Орда», Алматы', ru: '«Алтын Орда», Алматы' }, ctx),
          fontFamily: 'Oranienbaum',
          fontSize: T.lead,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'left',
          lineHeight: 1.2,
          letterSpacing: 0,
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
          y: 500,
          w: 80,
          h: 280,
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
    height: 800,
  });
}

// ---------------------------------------------------------------------------
// 8. RSVP — a hairline outline instead of a plate
// ---------------------------------------------------------------------------

export function mereiRsvp(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'shape',
        props: {
          x: 6,
          y: 20,
          w: 88,
          h: 740,
          shape: 'rect',
          fill: 'transparent',
          radius: 28,
          stroke: ctx.theme.ink,
          strokeWidth: 1,
          opacity: 0.55,
        },
        animate: false,
      },
      // 72% inside an 88% outline: the gate wants the surface at least 40px
      // wider than the text it carries.
      head(ctx, { kz: 'Қатысуыңызды растаңыз', ru: 'Подтвердите присутствие' }, 70, 14, 72),
      body(
        ctx,
        { kz: 'Мерейтойға келетініңізді хабарлаңыз.', ru: 'Сообщите, придёте ли вы.' },
        70 + 2 * HEAD_LINE + 26,
        { x: 14, w: 72, size: T.small },
      ),
      {
        type: 'rsvp-form',
        props: {
          x: 12,
          y: 280,
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
    height: 790,
  });
}

// ---------------------------------------------------------------------------
// 9. Wishes
// ---------------------------------------------------------------------------

export function mereiWishes(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Ізгі тілектер', ru: 'Добрые пожелания' }, 20, 10, 80),
      {
        type: 'wishes',
        props: {
          x: 10,
          y: 96,
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
    height: 450,
  });
}

// ---------------------------------------------------------------------------
// 10. Closing — centred again, and signed
// ---------------------------------------------------------------------------

export function mereiClosing(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      leaf(20, { which: 'a', x: 42, w: 16, rotation: -10, float: 8 }),
      body(
        ctx,
        { kz: 'Мерейтойымыздың қадірлі қонағы болыңыздар!', ru: 'Будьте дорогими гостями нашего юбилея!' },
        110,
        { w: 70, align: 'center' },
      ),
      {
        type: 'text',
        props: {
          x: 6,
          y: 210,
          w: 88,
          h: 'auto',
          text: t({ kz: 'Серіктің отбасы', ru: 'семья Серика' }, ctx),
          fontFamily: 'Shelley',
          fontSize: T.head,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: 0,
        },
        animate: { type: 'fade', duration: 2.8, delay: 0.3 },
      },
    ],
    height: 300,
  });
}
