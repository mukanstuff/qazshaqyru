/**
 * Sections for «Алтын ою» — the dark template.
 *
 * These are separate from `builders.ts` because they are not a palette swap of
 * it. The existing vocabulary assumes a painted cream card: illustrations do
 * the decorating, text sits in the clear middle, and every element arrives with
 * the same `fadeUp`. This one has no illustrations at all. Its decoration is
 * line ornament that draws itself, its ground is light rather than paint, and
 * its motion is choreographed per element — the names assemble letter by
 * letter while the crest behind them holds still and the ground drifts.
 *
 * The whole set is generated from one motif, қошқар мүйіз, through
 * `components/canvas/elements/oyu-ornaments.tsx`.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };
const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

/** Grounds are authored vector, not generated raster — see public/assets/grounds. */
export const OYU_GROUNDS = {
  hero: '/assets/grounds/oyu-hero.svg',
  mid: '/assets/grounds/oyu-mid.svg',
  closing: '/assets/grounds/oyu-closing.svg',
  photoSlot: '/assets/grounds/oyu-photo-slot.svg',
} as const;

/**
 * A ground fills its section and never animates or reacts to a click.
 *
 * `fade` feathers the named edges into the page. A ground that carries light —
 * the hero's glow, the closing pool — has to dissolve into the flat sections
 * next to it; butting two differently-lit rectangles together produces exactly
 * the horizontal seam that makes artwork read as pasted on.
 */
function ground(
  src: string,
  height: number,
  parallax = 0.1,
  fade?: { top?: number; bottom?: number },
): ElementSpec {
  /*
   * Overhang. A ground that drifts against the scroll has to be taller than
   * the section it fills, or the drift exposes a bare strip at one edge. The
   * renderer clamps parallax travel to one viewport times the factor, and 130px
   * covers that for every factor these sections use.
   */
  const OVERHANG = 130;
  return {
    type: 'image',
    props: {
      x: 0,
      y: -OVERHANG,
      w: 100,
      h: height + OVERHANG * 2,
      src,
      objectFit: 'cover',
      borderRadius: 0,
      parallax,
      zIndex: 1,
      ...(fade ? { maskFade: fade } : {}),
    },
    animate: false,
  };
}

interface HeroOptions {
  eyebrow?: Copy;
  first?: string;
  second?: string;
  dateLine?: Copy;
  venueLine?: Copy;
  targetIso?: string;
}

/**
 * Opening screen.
 *
 * The order of arrival is the design: frame, then title, then the couple, then
 * the rule beneath them, then the date. Nothing arrives at the same moment as
 * anything else, and the two ornaments draw rather than appear, so the screen
 * assembles itself in front of the guest instead of being already finished when
 * they get there.
 */
export function oyuHero(options: HeroOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 800;

    const elements: ElementSpec[] = [
      ground(OYU_GROUNDS.hero, HEIGHT, 0.12, { bottom: 12 }),

      // Frame corners, drawn in from opposite sides.
      {
        type: 'ornament',
        props: { x: 5, y: 30, w: 21, h: 80, ornamentId: 'oyu-corner', color: theme.accent },
        animate: { type: 'draw', duration: 1.5, delay: 0.15 },
      },
      {
        type: 'ornament',
        props: {
          x: 74,
          y: 30,
          w: 21,
          h: 80,
          ornamentId: 'oyu-corner',
          color: theme.accent,
          flipX: true,
        },
        animate: { type: 'draw', duration: 1.5, delay: 0.3 },
      },

      {
        type: 'text',
        props: {
          x: 10,
          y: 148,
          w: 80,
          h: 22,
          text: t(options.eyebrow ?? { kz: 'ҮЙЛЕНУ ТОЙЫНА ШАҚЫРУ', ru: 'ПРИГЛАШЕНИЕ НА СВАДЬБУ' }, ctx),
          fontFamily: theme.display,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: 4.5,
          lineHeight: 1.4,
          color: theme.muted,
          textAlign: 'center',
          placeholderKey: 'heroTitle',
        },
        animate: { type: 'revealUp', duration: 1.1, delay: 0.5 },
      },

      // The crest sits behind the names as a watermark, dim enough to be felt
      // rather than read, and drifts slower than everything in front of it.
      {
        type: 'ornament',
        props: {
          x: 8,
          y: 178,
          w: 84,
          h: 210,
          ornamentId: 'oyu-crest',
          // Wide enough that the two curls fall outside the column the names
          // occupy, and dark enough to stay behind them. At half this width it
          // sat directly on the second name and cost legibility.
          color: '#2f2b1c',
          parallax: 0.22,
          zIndex: 6,
        },
        animate: { type: 'fade', duration: 2.4, delay: 0.7 },
      },

      {
        type: 'couple-names',
        props: {
          x: 6,
          y: 228,
          w: 88,
          h: 'auto',
          first: options.first ?? 'Айдар',
          second: options.second ?? 'Айсұлу',
          connector: ctx.locale === 'ru' ? 'и' : 'және',
          font: theme.script,
          fontSize: 46,
          color: theme.ink,
          connectorColor: theme.accent,
          stacked: true,
          italic: false,
          placeholderKey: 'coupleNames',
          zIndex: 20,
        },
        animate: { type: 'letters', duration: 0.5, delay: 0.9 },
      },

      {
        type: 'ornament',
        props: { x: 16, y: 424, w: 68, h: 46, ornamentId: 'oyu-band', color: theme.accent },
        animate: { type: 'draw', duration: 1.9, delay: 1.5 },
      },

      {
        type: 'text',
        props: {
          x: 10,
          y: 486,
          w: 80,
          h: 22,
          text: t(options.dateLine ?? { kz: '15 МАМЫР 2027', ru: '15 МАЯ 2027' }, ctx),
          fontFamily: theme.display,
          fontSize: 14,
          fontWeight: 400,
          letterSpacing: 4,
          lineHeight: 1.4,
          color: theme.accent,
          textAlign: 'center',
          placeholderKey: 'eventDate',
        },
        animate: { type: 'revealUp', duration: 1, delay: 1.8 },
      },
      {
        type: 'text',
        props: {
          x: 12,
          y: 518,
          w: 76,
          h: 20,
          text: t(
            options.venueLine ?? {
              kz: '«Салтанат» сарайы · Астана',
              ru: 'Дворец «Салтанат» · Астана',
            },
            ctx,
          ),
          fontFamily: theme.body,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: 1.4,
          lineHeight: 1.5,
          color: theme.muted,
          textAlign: 'center',
          placeholderKey: 'venueName',
        },
        animate: { type: 'revealUp', duration: 1, delay: 1.95 },
      },

      {
        type: 'countdown',
        props: {
          x: 8,
          y: 580,
          w: 84,
          h: 86,
          targetIso: options.targetIso,
          fontFamily: theme.display,
          fontSize: 30,
          color: theme.ink,
          accentColor: theme.accent,
          showLabels: true,
          placeholderKey: 'eventDate',
        },
        animate: { type: 'fade', duration: 1.2, delay: 2.15 },
      },

      // Scroll cue: the thread the rest of the page hangs from.
      {
        type: 'ornament',
        props: { x: 46, y: 704, w: 8, h: 62, ornamentId: 'oyu-thread', color: theme.accent },
        animate: { type: 'draw', duration: 1.6, delay: 2.4 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

/** Ornament rule between sections, drawn from its centre outward. */
export function oyuBand(height = 150): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'ornament',
        props: {
          x: 14,
          y: Math.round(height / 2) - 24,
          w: 72,
          h: 48,
          ornamentId: 'oyu-band',
          color: ctx.theme.accent,
        },
        animate: { type: 'draw', duration: 1.8, delay: 0 },
      },
    ],
    height,
  });
}

interface GreetingOptions {
  title?: Copy;
  body?: Copy;
}

/** Address to the guests, on quiet ground with the spine running beside it. */
export function oyuGreeting(options: GreetingOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 400;
    return {
      elements: [
        ground(OYU_GROUNDS.mid, HEIGHT, 0.06),
        {
          type: 'heading',
          props: {
            x: 10,
            y: 58,
            w: 80,
            h: 'auto',
            as: 'h2',
            text: t(options.title ?? { kz: 'Құрметті қонақтар!', ru: 'Дорогие гости!' }, ctx),
            fontFamily: theme.display,
            fontSize: 27,
            fontWeight: 400,
            letterSpacing: 0.4,
            lineHeight: 1.3,
            color: theme.ink,
            textAlign: 'center',
          },
          animate: { type: 'revealUp', duration: 1.1, delay: 0 },
        },
        {
          type: 'text',
          props: {
            x: 13,
            y: 120,
            w: 74,
            h: 'auto',
            text: t(
              options.body ?? {
                kz: 'Сіздерді ұлымыз бен келінқызымыздың өміріндегі ең қуанышты күнге шақырамыз. Осы шаттықты бізбен бөлісуіңізді тілейміз.',
                ru: 'Приглашаем вас разделить с нами самый счастливый день в жизни наших детей. Будем рады видеть вас на нашем торжестве.',
              },
              ctx,
            ),
            fontFamily: theme.body,
            fontSize: 13,
            fontWeight: 300,
            letterSpacing: 0.3,
            lineHeight: 1.85,
            color: theme.muted,
            textAlign: 'center',
            placeholderKey: 'greetingText',
          },
          animate: { type: 'revealUp', duration: 1.1, delay: 0.2 },
        },
      ],
      height: HEIGHT,
    };
  };
}

interface PortraitOptions {
  eyebrow?: Copy;
  caption?: Copy;
}

/**
 * The photograph, cut into the ornament rather than into an arch or an oval.
 *
 * The slot ships with an authored placeholder panel instead of a stock couple:
 * a template that arrives carrying strangers' faces has to be undone before it
 * can be used, and the empty state is what a customer sees first in the
 * catalogue. The picture pushes in slowly while it is on screen, so the one
 * still frame on the page is not static.
 */
export function oyuPortrait(options: PortraitOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 620;
    return {
      elements: [
        ground(OYU_GROUNDS.mid, HEIGHT, 0.06),
        {
          type: 'text',
          props: {
            x: 10,
            y: 54,
            w: 80,
            h: 20,
            text: t(options.eyebrow ?? { kz: 'БІЗДІҢ СӘТІМІЗ', ru: 'НАШ МОМЕНТ' }, ctx),
            fontFamily: theme.display,
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: 4.5,
            lineHeight: 1.4,
            color: theme.muted,
            textAlign: 'center',
          },
          animate: { type: 'revealUp', duration: 1, delay: 0 },
        },
        {
          type: 'image',
          props: {
            x: 18,
            y: 100,
            w: 64,
            h: 380,
            src: OYU_GROUNDS.photoSlot,
            objectFit: 'cover',
            borderRadius: 0,
            maskShape: 'oyu',
            placeholderKey: 'couplePhoto',
            editableByEndUser: true,
            editableProperties: ['imageSrc'],
          },
          animate: { type: 'kenBurns', duration: 9.5, delay: 0.15 },
        },
        {
          type: 'text',
          props: {
            x: 14,
            y: 512,
            w: 72,
            h: 'auto',
            text: t(
              options.caption ?? {
                kz: 'Екі жүрек бір шаңырақ астында',
                ru: 'Два сердца под одним шаныраком',
              },
              ctx,
            ),
            fontFamily: theme.display,
            fontSize: 17,
            fontWeight: 400,
            letterSpacing: 0.4,
            lineHeight: 1.6,
            color: theme.ink,
            textAlign: 'center',
          },
          animate: { type: 'revealUp', duration: 1.1, delay: 0.4 },
        },
      ],
      height: HEIGHT,
    };
  };
}

interface WhenOptions {
  title?: Copy;
  targetIso?: string;
}

/**
 * Calendar in the display serif rather than the body sans.
 *
 * The stock calendar section asks for `theme.body`, which on this palette put a
 * grid of sans-serif numerals in the middle of an engraved gold page — the one
 * block that read as a piece of software.
 */
export function oyuWhen(options: WhenOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 500;
    return {
      elements: [
        ground(OYU_GROUNDS.mid, HEIGHT, 0.06),
        {
          type: 'text',
          props: {
            x: 10,
            y: 52,
            w: 80,
            h: 20,
            text: t(options.title ?? { kz: 'ТОЙ КҮНІ', ru: 'ДЕНЬ ТОРЖЕСТВА' }, ctx),
            fontFamily: theme.display,
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: 4.5,
            lineHeight: 1.4,
            color: theme.muted,
            textAlign: 'center',
          },
          animate: { type: 'revealUp', duration: 1, delay: 0 },
        },
        {
          type: 'calendar',
          props: {
            x: 12,
            y: 96,
            w: 76,
            h: 330,
            targetIso: options.targetIso,
            fontFamily: theme.display,
            fontSize: 15,
            color: theme.ink,
            accentColor: theme.accent,
            markStyle: 'ring',
            showMonthTitle: true,
            showWeekdays: true,
            placeholderKey: 'eventDate',
          },
          animate: { type: 'revealUp', duration: 1.2, delay: 0.2 },
        },
      ],
      height: HEIGHT,
    };
  };
}

interface ProgramOptions {
  title?: Copy;
}

/** The order of the day. */
export function oyuProgram(options: ProgramOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 520;
    const kz = ctx.locale !== 'ru';
    return {
      elements: [
        ground(OYU_GROUNDS.mid, HEIGHT, 0.06),
        {
          type: 'text',
          props: {
            x: 10,
            y: 52,
            w: 80,
            h: 20,
            text: t(options.title ?? { kz: 'ТОЙ БАҒДАРЛАМАСЫ', ru: 'ПРОГРАММА ВЕЧЕРА' }, ctx),
            fontFamily: theme.display,
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: 4.5,
            lineHeight: 1.4,
            color: theme.muted,
            textAlign: 'center',
          },
          animate: { type: 'revealUp', duration: 1, delay: 0 },
        },
        {
          type: 'program',
          props: {
            x: 10,
            y: 100,
            w: 80,
            h: 360,
            fontFamily: theme.body,
            bgColor: 'transparent',
            textColor: theme.ink,
            accentColor: theme.accent,
            timeColor: theme.accent,
            items: [
              {
                id: 'p1',
                time: '17:00',
                title: kz ? 'Қонақтарды қарсы алу' : 'Встреча гостей',
              },
              { id: 'p2', time: '18:00', title: kz ? 'Той бастау' : 'Начало торжества' },
              { id: 'p3', time: '19:30', title: kz ? 'Беташар' : 'Беташар' },
              { id: 'p4', time: '21:00', title: kz ? 'Той дастарханы' : 'Праздничный ужин' },
              { id: 'p5', time: '23:00', title: kz ? 'Тойдың соңы' : 'Завершение вечера' },
            ],
          },
          animate: { type: 'revealUp', duration: 1.2, delay: 0.2 },
        },
      ],
      height: HEIGHT,
    };
  };
}

interface ClosingOptions {
  line?: Copy;
}

/**
 * Closing screen: the medallion draws itself over the ground where the light
 * pools, and the page ends on a shape rather than on the last form field.
 */
export function oyuClosing(options: ClosingOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 500;
    return {
      elements: [
        ground(OYU_GROUNDS.closing, HEIGHT, 0.1, { top: 16 }),
        {
          type: 'ornament',
          props: { x: 30, y: 74, w: 40, h: 160, ornamentId: 'oyu-medallion', color: theme.accent },
          animate: { type: 'draw', duration: 2.4, delay: 0.1 },
        },
        {
          type: 'text',
          props: {
            x: 12,
            y: 272,
            w: 76,
            h: 'auto',
            text: t(
              options.line ?? {
                kz: 'Сіздерді тойымызда көруге асыға күтеміз',
                ru: 'С нетерпением ждём вас на нашем торжестве',
              },
              ctx,
            ),
            fontFamily: theme.display,
            fontSize: 20,
            fontWeight: 400,
            letterSpacing: 0.4,
            lineHeight: 1.55,
            color: theme.ink,
            textAlign: 'center',
          },
          animate: { type: 'revealUp', duration: 1.2, delay: 0.5 },
        },
        {
          type: 'ornament',
          props: { x: 38, y: 372, w: 24, h: 44, ornamentId: 'oyu-crest', color: theme.accent },
          animate: { type: 'fade', duration: 1.6, delay: 0.9 },
        },
      ],
      height: HEIGHT,
    };
  };
}
