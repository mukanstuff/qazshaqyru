/**
 * Sections for «Ақ мөр» — үйлену тойы.
 *
 * Built against the two reference services' *best sellers*, not their newest
 * cards. shaqyru24's API exposes `total_sold`, so the ordering is real: the
 * template below follows the one that has sold most, read screen by screen and
 * measured in the DOM.
 *
 * What that measurement changed, versus everything this catalogue shipped
 * before:
 *
 *  - The largest thing on the page is the YEAR, set in letterspaced antiqua at
 *    64px — not the couple's names, which are a comparatively modest 50px of
 *    script. Every template here had it the other way round.
 *  - Body copy is 14-16px. An earlier note in this repo recorded "their body is
 *    19.6px, their names 89.6px"; that came from one atypical card and is not
 *    what sells.
 *  - They mix seven faces in one template. Restraint reads as poverty here.
 *  - The palette is warm brown-gold — #6E563F, #816F4B, #9D7648 on cream — not
 *    yellow gold and not burgundy.
 *  - Photography is wedding *decor*: white peonies, rings on silk, pearls, a
 *    set table in a city restaurant. No steppe, no yurts, no national costume,
 *    no faces. Their customers are in Almaty and Astana.
 *
 * The torn paper edge between a photograph and the page is theirs too, on
 * almost every screen. Here it is a real photograph of a torn deckle keyed out
 * of a black backdrop — `cut-torn.webp` — not a shape drawn in code.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };
const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

const A = {
  paper: '/assets/templates/aq-mor/paper.webp',
  torn: '/assets/templates/aq-mor/cut-torn.webp',
  seal: '/assets/templates/aq-mor/cut-seal.webp',
  flowers: '/assets/templates/aq-mor/flowers.webp',
  flowers2: '/assets/templates/aq-mor/flowers-2.webp',
  rings: '/assets/templates/aq-mor/rings.webp',
  rings2: '/assets/templates/aq-mor/rings-2.webp',
  pearls: '/assets/templates/aq-mor/pearls.webp',
  venue: '/assets/templates/aq-mor/venue.webp',
  venue2: '/assets/templates/aq-mor/venue-2.webp',
} as const;

const OYU = {
  medallion: '/assets/templates/oyu-kit/oyu-medallion.png',
  rule: '/assets/templates/oyu-kit/oyu-rule.png',
} as const;

/**
 * Type scale, measured off the best seller and scaled 390/430.
 *
 * Kept as one object so a colourway variant can never drift from it — the
 * whole point of their catalogue is that one layout ships in six colours, and
 * that only works if the layout is a constant.
 */
const T = {
  year: 60,
  name: 48,
  day: 46,
  greet: 34,
  month: 22,
  city: 19,
  body: 15,
  label: 11.5,
} as const;

const gold = (ctx: SectionContext) => ctx.theme.accentDeep ?? ctx.theme.accent;

// ---------------------------------------------------------------------------
// Primitives — everything is centred, because everything of theirs is
// ---------------------------------------------------------------------------

function label(ctx: SectionContext, copy: Copy, y: number, color?: string): ElementSpec {
  return {
    type: 'text',
    props: {
      x: 8,
      y,
      w: 84,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Romul',
      fontSize: T.label,
      fontWeight: 400,
      color: color ?? ctx.theme.muted,
      textAlign: 'center',
      lineHeight: 1.5,
      letterSpacing: 4,
      uppercase: true,
    },
  };
}

function script(ctx: SectionContext, text: string, y: number, size: number, color?: string): ElementSpec {
  return {
    type: 'text',
    props: {
      x: 6,
      y,
      w: 88,
      h: 'auto',
      text,
      fontFamily: 'Corinthia',
      fontSize: size,
      fontWeight: 400,
      color: color ?? ctx.theme.accent,
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
  };
}

function body(ctx: SectionContext, copy: Copy, y: number, w = 78): ElementSpec {
  return {
    type: 'text',
    props: {
      x: (100 - w) / 2,
      y,
      w,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'Monolog',
      fontSize: T.body,
      fontWeight: 400,
      color: ctx.theme.ink,
      textAlign: 'center',
      lineHeight: 1.75,
      letterSpacing: 0,
    },
  };
}

/**
 * A photograph that ends in a torn paper edge.
 *
 * The edge is a real photographed deckle laid over the foot of the picture, so
 * the picture appears to be behind a torn sheet rather than cropped by a
 * rectangle. Two elements rather than one because the tear has to overlap the
 * photograph by its own height — a butt joint leaves a visible seam, which is
 * the thing the device exists to remove.
 */
function photoWithTear(src: string, y: number, h: number, opts: { grade?: object } = {}): ElementSpec[] {
  return [
    {
      type: 'image',
      props: {
        x: -4,
        y,
        w: 108,
        h,
        src,
        objectFit: 'cover',
        borderRadius: 0,
        ...(opts.grade ? { grade: opts.grade } : {}),
      },
      animate: false,
    },
    {
      type: 'image',
      props: {
        x: -4,
        y: y - 6,
        w: 108,
        h: 46,
        src: A.torn,
        objectFit: 'fill',
        borderRadius: 0,
        rotation: 180,
      },
      animate: false,
    },
    {
      type: 'image',
      props: {
        x: -4,
        // The tear sits ON the photograph's foot, not below it.
        y: y + h - 46,
        w: 108,
        h: 52,
        src: A.torn,
        objectFit: 'fill',
        borderRadius: 0,
      },
      animate: false,
    },
  ];
}

// ---------------------------------------------------------------------------
// 1. Opening card
// ---------------------------------------------------------------------------

export function amHero(options: { first?: string; second?: string } = {}): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      label(ctx, { kz: 'Wedding day', ru: 'Wedding day' }, 54, gold(ctx)),
      {
        type: 'couple-names',
        props: {
          x: 6,
          y: 86,
          w: 88,
          h: 'auto',
          first: options.first ?? 'Самат',
          second: options.second ?? 'Динара',
          connector: '&',
          font: 'Corinthia',
          fontSize: T.name,
          color: ctx.theme.accent,
          connectorColor: gold(ctx),
          stacked: true,
          placeholderKey: 'coupleNames',
        },
        animate: { type: 'fadeUp', duration: 0.9, delay: 0.05 },
      },
      {
        type: 'image',
        props: {
          x: 40,
          y: 262,
          w: 20,
          h: 22,
          src: OYU.rule,
          tint: gold(ctx),
          objectFit: 'contain',
          borderRadius: 0,
        },
      },
      label(ctx, { kz: '15 мамыр 2027', ru: '15 мая 2027' }, 302, ctx.theme.ink),
    ],
    height: 372,
  });
}

// ---------------------------------------------------------------------------
// 2. Flowers
// ---------------------------------------------------------------------------

export function amFlowers(): SectionBuilder {
  return (): SectionResult => ({
    elements: photoWithTear(A.flowers, 0, 330),
    height: 348,
  });
}

// ---------------------------------------------------------------------------
// 3. Greeting
// ---------------------------------------------------------------------------

export function amGreeting(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      script(ctx, t({ kz: 'Құрметті қонақтар!', ru: 'Дорогие гости!' }, ctx), 26, T.greet, ctx.theme.ink),
      body(
        ctx,
        {
          kz: 'Сіздерді ұлымыз Самат пен қызымыз Динараның үйлену тойына арналған салтанатты ақ дастарханымыздың қадірлі қонағы болуға шақырамыз.',
          ru: 'Приглашаем вас разделить с нами торжество по случаю бракосочетания наших детей — Самата и Динары.',
        },
        104
      ),
      {
        type: 'image',
        props: {
          x: 42,
          y: 296,
          w: 16,
          h: 18,
          src: OYU.rule,
          tint: gold(ctx),
          objectFit: 'contain',
          borderRadius: 0,
        },
      },
    ],
    height: 356,
  });
}

// ---------------------------------------------------------------------------
// 4. Date — the year is the biggest thing on the page
// ---------------------------------------------------------------------------

export function amDate(options: { targetIso?: string } = {}): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      label(ctx, { kz: 'Өтетін күні', ru: 'Дата торжества' }, 0),
      {
        type: 'heading',
        props: {
          x: 6,
          y: 26,
          w: 88,
          h: 'auto',
          text: t({ kz: 'МАМЫР', ru: 'МАЙ' }, ctx),
          fontFamily: 'Oranienbaum',
          fontSize: T.month,
          fontWeight: 400,
          color: ctx.theme.accent,
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: 8,
          uppercase: true,
        },
      },
      {
        type: 'heading',
        props: {
          x: 6,
          y: 62,
          w: 88,
          h: 'auto',
          text: '2027',
          fontFamily: 'Oranienbaum',
          fontSize: T.year,
          fontWeight: 400,
          color: ctx.theme.accent,
          textAlign: 'center',
          lineHeight: 1.05,
          letterSpacing: 6,
        },
        animate: { type: 'fadeUp', duration: 0.85, delay: 0.1 },
      },
      label(ctx, { kz: 'сенбі · сағат 17:00', ru: 'суббота · 17:00' }, 148, ctx.theme.muted),
      {
        type: 'calendar',
        props: {
          x: 8,
          y: 196,
          w: 84,
          h: 300,
          targetIso: options.targetIso,
          fontFamily: 'Monolog',
          fontSize: 14,
          color: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          markStyle: 'ring',
          showMonthTitle: false,
          showWeekdays: true,
        },
      },
      {
        type: 'countdown',
        props: {
          x: 8,
          y: 512,
          w: 84,
          h: 84,
          targetIso: options.targetIso,
          fontFamily: 'Oranienbaum',
          fontSize: 28,
          color: ctx.theme.accent,
          accentColor: ctx.theme.muted,
          showLabels: true,
        },
      },
    ],
    height: 636,
  });
}

// ---------------------------------------------------------------------------
// 5. Rings
// ---------------------------------------------------------------------------

export function amRings(): SectionBuilder {
  return (): SectionResult => ({
    elements: photoWithTear(A.rings, 0, 300),
    height: 318,
  });
}

// ---------------------------------------------------------------------------
// 6. Programme
// ---------------------------------------------------------------------------

export function amProgram(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      label(ctx, { kz: 'Той бағдарламасы', ru: 'Программа' }, 0),
      {
        type: 'program',
        props: {
          x: 12,
          y: 34,
          w: 76,
          h: 210,
          items: [
            { id: 'p1', time: '17:00', title: t({ kz: 'Қонақтарды қарсы алу', ru: 'Встреча гостей' }, ctx) },
            { id: 'p2', time: '18:00', title: t({ kz: 'Тойдың басталуы', ru: 'Начало торжества' }, ctx) },
            { id: 'p3', time: '20:00', title: t({ kz: 'Той салтанаты', ru: 'Праздничная часть' }, ctx) },
            { id: 'p4', time: '22:00', title: t({ kz: 'Тойдың тортын тарту', ru: 'Свадебный торт' }, ctx) },
          ],
          fontFamily: 'Monolog',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          timeColor: gold(ctx),
        },
      },
    ],
    height: 272,
  });
}

// ---------------------------------------------------------------------------
// 7. Venue — a city restaurant, which is where these weddings actually happen
// ---------------------------------------------------------------------------

export function amVenue(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      ...photoWithTear(A.venue, 0, 300),
      label(ctx, { kz: 'Мекен-жайы', ru: 'Место проведения' }, 336),
      {
        type: 'heading',
        props: {
          x: 8,
          y: 362,
          w: 84,
          h: 'auto',
          text: t({ kz: 'Алматы', ru: 'Алматы' }, ctx),
          fontFamily: 'Oranienbaum',
          fontSize: T.city,
          fontWeight: 400,
          color: ctx.theme.accent,
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: 3,
          uppercase: true,
        },
      },
      script(ctx, t({ kz: 'мейрамхана «Абиба»', ru: 'ресторан «Абиба»' }, ctx), 392, 30, ctx.theme.ink),
      {
        type: 'button',
        props: {
          x: 27,
          y: 452,
          w: 46,
          h: 46,
          label: t({ kz: 'Картаны ашу', ru: 'Открыть карту' }, ctx),
          action: { kind: 'map' },
          bgColor: ctx.theme.accent,
          textColor: '#FDF8F0',
          fontFamily: 'Montserrat',
          fontSize: 12,
          borderRadius: 23,
        },
      },
    ],
    height: 552,
  });
}

// ---------------------------------------------------------------------------
// 8. Pearls
// ---------------------------------------------------------------------------

export function amPearls(): SectionBuilder {
  return (): SectionResult => ({
    elements: photoWithTear(A.pearls, 0, 280),
    height: 298,
  });
}

// ---------------------------------------------------------------------------
// 9. RSVP
// ---------------------------------------------------------------------------

export function amRsvp(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      script(ctx, t({ kz: 'Қатысуыңызды растаңыз', ru: 'Подтвердите присутствие' }, ctx), 0, 34, ctx.theme.accent),
      label(ctx, { kz: 'Тойға келуіңізді растауыңызды сұраймыз', ru: 'Просим подтвердить присутствие' }, 62),
      {
        type: 'rsvp-form',
        props: {
          x: 8,
          y: 112,
          w: 84,
          h: 540,
          fontFamily: 'Monolog',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          askPlusOne: true,
          askDietary: false,
          askChildren: false,
        },
      },
    ],
      // Heights measured in the browser, not guessed. The rsvp-form renders
      // 528px of content in its open state and the wishes list 344px; both boxes
      // were set to less and their contents spilled onto the section below —
      // the submit button was sitting under the next headline.
      //
      // This is a patch over a structural flaw: a section declares a fixed
      // height while the components inside it size to their own content, their
      // state and the length of the translation. Sections should measure their
      // children instead. Until they do, every one of these numbers is a hazard.
    height: 690,
  });
}

// ---------------------------------------------------------------------------
// 10. Wishes
// ---------------------------------------------------------------------------

export function amWishes(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      script(ctx, t({ kz: 'Ізгі тілектер', ru: 'Пожелания' }, ctx), 0, 34, ctx.theme.accent),
      {
        type: 'wishes',
        props: {
          x: 8,
          y: 66,
          w: 84,
          h: 350,
          fontFamily: 'Monolog',
          bgColor: 'transparent',
          textColor: ctx.theme.ink,
          accentColor: ctx.theme.accent,
          reactions: [
            String.fromCodePoint(0x2764, 0xfe0f),
            String.fromCodePoint(0x1f64f),
            String.fromCodePoint(0x1f942),
            String.fromCodePoint(0x1f44f),
          ],
          allowAnonymous: true,
        },
      },
    ],
    height: 450,
  });
}

// ---------------------------------------------------------------------------
// 11. Hosts — near the end, exactly where the reference cards put it
// ---------------------------------------------------------------------------

export function amHosts(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: 36,
          y: 0,
          w: 28,
          h: 108,
          src: OYU.medallion,
          tint: 'rgba(157,118,72,0.30)',
          objectFit: 'contain',
          borderRadius: 0,
        },
        animate: false,
      },
      label(ctx, { kz: 'Той иелері', ru: 'Хозяева торжества' }, 130),
      script(ctx, t({ kz: 'Болмановтар әулеті', ru: 'Семья Болмановых' }, ctx), 156, 32, ctx.theme.accent),
    ],
    height: 246,
  });
}

// ---------------------------------------------------------------------------
// 12. Closing
// ---------------------------------------------------------------------------

export function amClosing(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'image',
        props: {
          x: -4,
          y: 0,
          w: 108,
          h: 380,
          src: A.venue2,
          objectFit: 'cover',
          borderRadius: 0,
          overlayGradient: {
            from: 'rgba(26,18,10,0.15)',
            to: 'rgba(26,18,10,0.62)',
            angle: 180,
          },
        },
        animate: false,
      },
      {
        type: 'image',
        props: {
          x: -4,
          y: -6,
          w: 108,
          h: 52,
          src: A.torn,
          objectFit: 'fill',
          borderRadius: 0,
          rotation: 180,
        },
        animate: false,
      },
      {
        type: 'heading',
        props: {
          x: 8,
          y: 286,
          w: 84,
          h: 'auto',
          text: t({ kz: 'Оқиға басталды!', ru: 'История началась!' }, ctx),
          fontFamily: 'Oranienbaum',
          fontSize: 26,
          fontWeight: 400,
          color: ctx.theme.onPhoto,
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: 2,
        },
      },
    ],
    height: 400,
  });
}
