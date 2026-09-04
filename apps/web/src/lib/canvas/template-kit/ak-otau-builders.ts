/**
 * Sections for «Ақ отау».
 *
 * Written against the two reference services rather than against the existing
 * templates here, after reading both of their rendered pages:
 *
 *  - They lead with a full-bleed photograph, always. Every template in this
 *    catalogue so far leads with type on a flat ground, which is the single
 *    largest reason ours read as a draft next to theirs.
 *  - They layer. Artwork runs off the edges, overlaps, and sits *over* the
 *    photograph; ours stacked centred blocks in one column with 400-600px of
 *    dead space between them.
 *  - Their motion has two halves: an entrance per element AND a loop that never
 *    stops (`spin`, `float`, `swayLR`). This engine only had entrances, so a
 *    page went completely still once it finished loading. `idle` exists now and
 *    is used here deliberately and sparingly.
 *  - Their density is roughly a screen of content per 600px. Nothing here is
 *    allowed an empty half-screen.
 *
 * The palette (ivory / antique gold / қызыл) and the қошқар мүйіз motif are the
 * distinctly Kazakh register of that grammar, not a copy of any one card.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };
const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

/** Where the generated artwork lands. See docs/ak-otau-assets.md. */
export const AK_OTAU_ASSETS = {
  hero: '/assets/templates/ak-otau/hero.webp',
  closing: '/assets/templates/ak-otau/closing.webp',
  story1: '/assets/templates/ak-otau/story-1.webp',
  story2: '/assets/templates/ak-otau/story-2.webp',
  story3: '/assets/templates/ak-otau/story-3.webp',
  oyuHero: '/assets/templates/ak-otau/oyu-hero.png',
  oyuMedallion: '/assets/templates/ak-otau/oyu-medallion.png',
  oyuDivider: '/assets/templates/ak-otau/oyu-divider.png',
} as const;

/** Fallback so a missing `accentDeep` degrades to the theme's gold rather than
 *  to an invented colour that belongs to no palette. */
const deep = (ctx: SectionContext) => ctx.theme.accentDeep ?? ctx.theme.accent;

/**
 * A tinted ornament.
 *
 * `tint` paints the file's silhouette in a theme colour instead of loading it
 * as a picture, so one asset is white over the photograph, gold on ivory and
 * қызыл on the seal. Hardcoding those colours into the artwork is what made
 * earlier ornament work here unusable the moment a palette changed.
 */
function oyu(props: {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  z?: number;
  rotation?: number;
  idle?: { type: 'spin' | 'float' | 'sway' | 'pulse'; duration: number };
  parallax?: number;
}): ElementSpec['props'] {
  return {
    x: props.x,
    y: props.y,
    w: props.w,
    h: props.h,
    src: props.src,
    tint: props.color,
    objectFit: 'contain',
    borderRadius: 0,
    ...(props.rotation !== undefined ? { rotation: props.rotation } : {}),
    ...(props.idle ? { idle: props.idle } : {}),
    ...(props.parallax ? { parallax: props.parallax } : {}),
    ...(props.z !== undefined ? { zIndex: props.z } : {}),
  };
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------

interface HeroOptions {
  first?: string;
  second?: string;
  eyebrow?: Copy;
  dateLine?: Copy;
  venueLine?: Copy;
}

/**
 * The opening screen, and the only one most guests will screenshot.
 *
 * Construction, bottom to top: a full-bleed photograph that pushes in slowly
 * and feathers into the paper at its foot; a large ornament bleeding off the
 * top-right corner, turning once every two minutes; the names; a turning seal.
 *
 * The photograph does not animate in. A full-bleed image sliding up into place
 * reads as a page-load glitch, and it would drag the type that sits inside it.
 */
export function akHero(options: HeroOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 790;

    const elements: ElementSpec[] = [
      // Photograph. Slightly wider than the page and lifted above it, so the
      // Ken Burns push never exposes an edge.
      {
        type: 'image',
        props: {
          x: -3,
          // Overhang lives at the TOP, and the foot stops exactly on the section
          // boundary.
          //
          // It used to be y:-40 with h:HEIGHT+90, so the photograph already
          // hung 50px into the section below before any motion; parallax then
          // drifted it down by up to another 67px, and the next section's
          // heading ended up 93px inside the picture, on a part of the fade
          // that is still ~60% opaque. Measured at four scroll positions: the
          // overlap grew from 15px at rest to 93px scrolled — which is exactly
          // the 'text creeps up onto the photo as you scroll' report.
          y: -76,
          w: 106,
          h: HEIGHT + 76,
          src: AK_OTAU_ASSETS.hero,
          objectFit: 'cover',
          borderRadius: 0,
          // Feathered foot: the photograph has to dissolve into the ivory of
          // the next section. Butting a photograph against a flat colour is
          // the seam that makes artwork read as pasted on.
          maskFade: { bottom: 20 },
          // Scrim at the TOP, because that is where the type is.
          //
          // The hero photograph is composed the way the brief asked for and
          // the way the reference cards are shot: empty sky across the upper
          // third, the couple low and centred. Type therefore belongs in the
          // sky — laying it across the middle puts the names on top of the
          // faces and the dress, which is what the first build did. The sky is
          // pale, so white type still needs darkening behind it; the gradient
          // runs from a soft wash at the crown down to nothing by the time it
          // reaches the couple, so the photograph itself is never dulled.
          overlayGradient: {
            from: 'rgba(24,16,12,0.58)',
            to: 'rgba(24,16,12,0.04)',
            angle: 180,
          },
          // Pulled a little toward the paper so the picture and the page are
          // the same temperature.
          grade: { saturate: 92, brightness: 103 },
          // 0.045 caps the travel at ~38px, which the top overhang absorbs.
          parallax: 0.045,
          zIndex: 2,
          placeholderKey: 'coverPhoto',
        },
        animate: { type: 'kenBurns', duration: 10, delay: 0 },
      },

      // The big ornament, cropped by the page edge on purpose — this is the
      // device both reference services use to stop a photograph reading as a
      // rectangle. 110s is slow enough that it is never caught moving.
      {
        type: 'image',
        props: oyu({
          src: AK_OTAU_ASSETS.oyuHero,
          x: 58,
          y: 492,
          w: 62,
          h: 230,
          color: 'rgba(255,255,255,0.11)',
          z: 3,
          idle: { type: 'spin', duration: 110 },
        }),
        animate: { type: 'fade', duration: 2.2, delay: 0.4 },
      },
      {
        type: 'image',
        props: oyu({
          src: AK_OTAU_ASSETS.oyuHero,
          x: -26,
          y: 536,
          w: 58,
          h: 214,
          color: 'rgba(255,255,255,0.09)',
          z: 3,
          idle: { type: 'spin', duration: 120 },
        }),
        animate: { type: 'fade', duration: 2.4, delay: 0.7 },
      },

      {
        type: 'text',
        props: {
          x: 6,
          y: 70,
          w: 88,
          h: 'auto',
          text: t(options.eyebrow ?? { kz: 'ҮЙЛЕНУ ТОЙЫНА ШАҚЫРУ', ru: 'ПРИГЛАШЕНИЕ НА СВАДЬБУ' }, ctx),
          fontFamily: theme.display,
          fontSize: 12.5,
          letterSpacing: 2.4,
          color: theme.onPhoto,
          textAlign: 'center',
          textShadow: { x: 0, y: 1, blur: 4, color: 'rgba(0,0,0,0.75)' },
          zIndex: 20,
          placeholderKey: 'heroTitle',
        },
        animate: { type: 'revealUp', duration: 1.1, delay: 0.5 },
      },

      {
        type: 'couple-names',
        props: {
          x: 4,
          y: 100,
          w: 92,
          h: 'auto',
          first: options.first ?? 'Айдар',
          second: options.second ?? 'Айсұлу',
          connector: ctx.locale === 'ru' ? 'и' : 'және',
          font: theme.script,
          fontSize: 70,
          color: theme.onPhoto,
          connectorColor: 'rgba(255,255,255,0.72)',
          stacked: true,
          italic: true,
          zIndex: 22,
          placeholderKey: 'coupleNames',
        },
        animate: { type: 'letters', duration: 0.5, delay: 0.85 },
      },

      {
        type: 'text',
        props: {
          x: 10,
          y: 380,
          w: 80,
          h: 20,
          text: t(options.dateLine ?? { kz: '15 МАМЫР 2027', ru: '15 МАЯ 2027' }, ctx),
          fontFamily: theme.display,
          fontSize: 15,
          letterSpacing: 2.2,
          color: theme.onPhoto,
          textAlign: 'center',
          textShadow: { x: 0, y: 1, blur: 4, color: 'rgba(0,0,0,0.7)' },
          zIndex: 20,
          placeholderKey: 'eventDate',
        },
        animate: { type: 'revealUp', duration: 1, delay: 1.5 },
      },
      {
        type: 'text',
        props: {
          x: 10,
          y: 412,
          w: 80,
          h: 20,
          text: t(
            options.venueLine ?? { kz: '«Салтанат» сарайы · Астана', ru: '«Салтанат» · Астана' },
            ctx,
          ),
          fontFamily: theme.body,
          fontSize: 13.5,
          letterSpacing: 1,
          color: 'rgba(255,255,255,0.88)',
          textAlign: 'center',
          textShadow: { x: 0, y: 1, blur: 4, color: 'rgba(0,0,0,0.7)' },
          zIndex: 20,
          placeholderKey: 'venueName',
        },
        animate: { type: 'revealUp', duration: 1, delay: 1.65 },
      },

      // The seal. Solid қызыл disc with the rosette knocked through it in
      // ivory, turning slowly — the anchor that ends the opening screen.
      {
        type: 'shape',
        props: {
          x: 39,
          y: 648,
          w: 22,
          h: 86,
          shape: 'circle',
          fill: deep(ctx),
          zIndex: 24,
        },
        animate: { type: 'zoomIn', duration: 0.9, delay: 1.9 },
      },
      {
        type: 'image',
        props: oyu({
          src: AK_OTAU_ASSETS.oyuMedallion,
          x: 40.6,
          y: 654,
          w: 18.8,
          h: 74,
          color: theme.paper,
          z: 25,
          idle: { type: 'spin', duration: 46 },
        }),
        animate: { type: 'fade', duration: 1, delay: 2.1 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 2. Invitation text
// ---------------------------------------------------------------------------

interface InviteOptions {
  eyebrow?: Copy;
  body?: Copy;
}

export function akInvite(options: InviteOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 358;

    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 6,
          y: 48,
          w: 88,
          // 'auto', never a fixed height, for anything animated with revealUp.
          //
          // That animation clips to the element's own border box, so a 29px
          // heading left in a 20px box was permanently sliced in half —
          // visible at the top of this section as a heading cut through the
          // middle. Overflow being visible does not save it: clip-path ignores
          // overflow.
          h: 'auto',
          text: t(
            options.eyebrow ?? { kz: 'Құрметті қонақтар', ru: 'Дорогие гости' },
            ctx,
          ),
          fontFamily: theme.display,
          fontSize: 29,
          letterSpacing: 1.6,
          lineHeight: 1.25,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0 },
      },
      {
        type: 'text',
        props: {
          x: 11,
          y: 112,
          w: 78,
          h: 'auto',
          text: t(
            options.body ?? {
              kz:
                'Өмірімізіздегі ең қуанышты күнді жақын адамдарымызбен бірге атап өткіміз келеді. ' +
                'Тойымызға қатысып, шаттығымызды бөлісуіңізді зор ықыласпен сұраймыз.',
              ru:
                'Мы хотим встретить самый счастливый день нашей жизни рядом с близкими. ' +
                'Будем искренне рады видеть вас на нашем тое и разделить с вами эту радость.',
            },
            ctx,
          ),
          fontFamily: theme.display,
          fontSize: 19.5,
          lineHeight: 1.75,
          color: theme.ink,
          textAlign: 'center',
          placeholderKey: 'greetingText',
        },
        animate: { type: 'revealUp', duration: 1.15, delay: 0.12 },
      },
      {
        type: 'image',
        props: oyu({
          src: AK_OTAU_ASSETS.oyuDivider,
          x: 24,
          y: 298,
          w: 52,
          h: 24,
          color: theme.accent,
          idle: { type: 'float', duration: 8 },
        }),
        animate: { type: 'fade', duration: 1.2, delay: 0.3 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 3. Hosts
// ---------------------------------------------------------------------------

interface HostsOptions {
  eyebrow?: Copy;
  groomSide?: Copy;
  brideSide?: Copy;
}

/**
 * Той иелері — the hosting families.
 *
 * Present on both reference services and absent from every template here. In
 * a Kazakh toi the invitation comes *from* the parents as much as from the
 * couple, and leaving it out is a cultural omission, not a layout choice.
 */
export function akHosts(options: HostsOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 300;

    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 6,
          y: 48,
          w: 88,
          h: 'auto',
          text: t(options.eyebrow ?? { kz: 'Той иелері', ru: 'Хозяева тоя' }, ctx),
          fontFamily: theme.display,
          fontSize: 29,
          letterSpacing: 1.6,
          lineHeight: 1.25,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0 },
      },
      {
        type: 'text',
        props: {
          x: 6,
          y: 116,
          w: 40,
          h: 'auto',
          text: t(
            options.groomSide ?? { kz: 'Күйеу жігіт жағынан', ru: 'Со стороны жениха' },
            ctx,
          ),
          fontFamily: theme.body,
          fontSize: 12.5,
          letterSpacing: 0.8,
          color: theme.muted,
          textAlign: 'center',
        },
        animate: { type: 'slideRight', duration: 0.9, delay: 0.1 },
      },
      {
        type: 'text',
        props: {
          x: 6,
          y: 142,
          w: 40,
          h: 'auto',
          text: 'Серік және Гүлнар',
          fontFamily: theme.display,
          fontSize: 22,
          lineHeight: 1.35,
          color: theme.ink,
          textAlign: 'center',
        },
        animate: { type: 'slideRight', duration: 0.9, delay: 0.18 },
      },
      // A hairline between the two families rather than a gap: the gap alone
      // read as two unrelated blocks.
      {
        type: 'shape',
        props: { x: 49.6, y: 92, w: 0.8, h: 78, shape: 'rect', fill: theme.accent, opacity: 0.35 },
        animate: { type: 'fade', duration: 1, delay: 0.3 },
      },
      {
        type: 'text',
        props: {
          x: 54,
          y: 116,
          w: 40,
          h: 'auto',
          text: t(options.brideSide ?? { kz: 'Қалыңдық жағынан', ru: 'Со стороны невесты' }, ctx),
          fontFamily: theme.body,
          fontSize: 12.5,
          letterSpacing: 0.8,
          color: theme.muted,
          textAlign: 'center',
        },
        animate: { type: 'slideLeft', duration: 0.9, delay: 0.1 },
      },
      {
        type: 'text',
        props: {
          x: 54,
          y: 142,
          w: 40,
          h: 'auto',
          text: 'Бақыт және Айгүл',
          fontFamily: theme.display,
          fontSize: 22,
          lineHeight: 1.35,
          color: theme.ink,
          textAlign: 'center',
        },
        animate: { type: 'slideLeft', duration: 0.9, delay: 0.18 },
      },
      {
        type: 'text',
        props: {
          x: 12,
          y: 226,
          w: 76,
          h: 'auto',
          text: t(
            {
              kz: '«Екі жастың бақыты — екі әулеттің қуанышы»',
              ru: '«Счастье двоих — радость двух семей»',
            },
            ctx,
          ),
          fontFamily: theme.script,
          fontSize: 19,
          italic: true,
          lineHeight: 1.55,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1.1, delay: 0.34 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 4. Story — the photo set
// ---------------------------------------------------------------------------

/**
 * Three photographs, deliberately not a row.
 *
 * A three-up grid of equal thumbnails is what a CMS produces. Offsetting them,
 * letting one bleed past the page edge and giving each a different entrance
 * direction is what makes a set of stills read as a spread.
 */
export function akStory(options: { eyebrow?: Copy } = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 530;

    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 6,
          y: 48,
          w: 88,
          h: 'auto',
          text: t(options.eyebrow ?? { kz: 'Біздің тарих', ru: 'Наша история' }, ctx),
          fontFamily: theme.display,
          fontSize: 29,
          letterSpacing: 1.6,
          lineHeight: 1.25,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0 },
      },

      // Tall plate, bleeding off the left edge.
      {
        type: 'image',
        props: {
          x: 6,
          y: 104,
          w: 50,
          h: 286,
          src: AK_OTAU_ASSETS.story1,
          objectFit: 'cover',
          borderRadius: 2,
          grade: { saturate: 92 },
          zIndex: 10,
        },
        animate: { type: 'slideRight', duration: 1, delay: 0.1 },
      },
      // Two smaller plates stepping down the right side, overlapping the first
      // slightly so the group reads as one object.
      {
        type: 'image',
        props: {
          x: 58,
          y: 84,
          w: 36,
          h: 168,
          src: AK_OTAU_ASSETS.story2,
          objectFit: 'cover',
          borderRadius: 2,
          grade: { saturate: 92 },
          zIndex: 11,
        },
        animate: { type: 'slideLeft', duration: 1, delay: 0.24 },
      },
      {
        type: 'image',
        props: {
          x: 58,
          y: 264,
          w: 36,
          h: 160,
          src: AK_OTAU_ASSETS.story3,
          objectFit: 'cover',
          borderRadius: 2,
          grade: { saturate: 92 },
          zIndex: 12,
        },
        animate: { type: 'slideLeft', duration: 1, delay: 0.38 },
      },

      {
        type: 'text',
        props: {
          x: 8,
          y: 436,
          w: 84,
          h: 'auto',
          text: t(
            {
              kz: 'Бір қарасудан басталған жол — бір шаңырақпен жалғасады.',
              ru: 'Путь, начавшийся с одного взгляда, продолжается одним домом.',
            },
            ctx,
          ),
          fontFamily: theme.script,
          fontSize: 19,
          italic: true,
          lineHeight: 1.6,
          color: theme.ink,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1.1, delay: 0.5 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 5. When — date, countdown, calendar
// ---------------------------------------------------------------------------

export function akWhen(options: { targetIso?: string; eyebrow?: Copy } = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 690;

    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 6,
          y: 48,
          w: 88,
          h: 'auto',
          text: t(options.eyebrow ?? { kz: 'Той күні', ru: 'Дата тоя' }, ctx),
          fontFamily: theme.display,
          fontSize: 29,
          letterSpacing: 1.6,
          lineHeight: 1.25,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0 },
      },
      {
        type: 'heading',
        props: {
          x: 8,
          y: 100,
          w: 84,
          h: 'auto',
          as: 'h2',
          text: t({ kz: '15 мамыр, 2027', ru: '15 мая, 2027' }, ctx),
          fontFamily: theme.display,
          fontSize: 38,
          fontWeight: 400,
          color: theme.ink,
          textAlign: 'center',
          placeholderKey: 'eventDate',
        },
        animate: { type: 'revealUp', duration: 1.1, delay: 0.12 },
      },
      {
        type: 'countdown',
        props: {
          x: 6,
          y: 176,
          w: 88,
          h: 92,
          targetIso: options.targetIso,
          fontFamily: theme.display,
          fontSize: 36,
          color: theme.ink,
          accentColor: theme.accent,
          showLabels: true,
          labels:
            ctx.locale === 'ru'
              ? { days: 'дней', hours: 'часов', minutes: 'минут', seconds: 'секунд' }
              : { days: 'күн', hours: 'сағат', minutes: 'минут', seconds: 'секунд' },
        },
        animate: { type: 'fadeUp', duration: 0.9, delay: 0.26 },
      },
      {
        type: 'calendar',
        props: {
          x: 8,
          y: 272,
          w: 84,
          h: 348,
          targetIso: options.targetIso,
          fontFamily: theme.display,
          fontSize: 19,
          color: theme.ink,
          accentColor: deep(ctx),
          markStyle: 'fill',
          showMonthTitle: true,
          showWeekdays: true,
        },
        animate: { type: 'fadeUp', duration: 1, delay: 0.36 },
      },
      {
        type: 'image',
        props: oyu({
          src: AK_OTAU_ASSETS.oyuDivider,
          x: 28,
          y: 626,
          w: 44,
          h: 20,
          color: theme.accent,
          idle: { type: 'sway', duration: 11 },
        }),
        animate: { type: 'fade', duration: 1.2, delay: 0.5 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 6. Program
// ---------------------------------------------------------------------------

export function akProgram(options: { eyebrow?: Copy } = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 352;

    const items =
      ctx.locale === 'ru'
        ? [
            { id: 'p1', time: '17:00', title: 'Встреча гостей' },
            { id: 'p2', time: '18:00', title: 'Начало тоя' },
            { id: 'p3', time: '19:30', title: 'Беташар' },
            { id: 'p4', time: '21:00', title: 'Той дастархан' },
            { id: 'p5', time: '23:00', title: 'Завершение' },
          ]
        : [
            { id: 'p1', time: '17:00', title: 'Қонақтарды қарсы алу' },
            { id: 'p2', time: '18:00', title: 'Тойдың басталуы' },
            { id: 'p3', time: '19:30', title: 'Беташар' },
            { id: 'p4', time: '21:00', title: 'Той дастарханы' },
            { id: 'p5', time: '23:00', title: 'Тойдың соңы' },
          ];

    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 6,
          y: 48,
          w: 88,
          h: 'auto',
          text: t(options.eyebrow ?? { kz: 'Бағдарлама', ru: 'Программа' }, ctx),
          fontFamily: theme.display,
          fontSize: 29,
          letterSpacing: 1.6,
          lineHeight: 1.25,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0 },
      },
      {
        type: 'program',
        props: {
          x: 6,
          y: 106,
          w: 80,
          h: 212,
          items,
          fontFamily: theme.display,
          bgColor: 'transparent',
          textColor: theme.ink,
          accentColor: deep(ctx),
          timeColor: theme.accent,
        },
        animate: { type: 'fadeUp', duration: 1, delay: 0.12 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 7. Dress code
// ---------------------------------------------------------------------------

export function akDressCode(): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 276;

    // Swatches are drawn from the theme, never from literals: a hardcoded
    // palette here would contradict the page the moment the theme changed.
    const swatches = [theme.paper, theme.accent, deep(ctx), theme.ink];

    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 6,
          y: 48,
          w: 88,
          h: 'auto',
          text: t({ kz: 'Киім үлгісі', ru: 'Дресс-код' }, ctx),
          fontFamily: theme.display,
          fontSize: 29,
          letterSpacing: 1.6,
          lineHeight: 1.25,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0 },
      },
      {
        type: 'text',
        props: {
          x: 12,
          y: 106,
          w: 76,
          h: 'auto',
          text: t(
            {
              kz: 'Тойымыздың түстеріне үйлесетін салтанатты киім кисеңіздер, ризашылығымызды білдіреміз.',
              ru: 'Будем признательны, если вы выберете торжественный образ в цветах нашего тоя.',
            },
            ctx,
          ),
          fontFamily: theme.display,
          fontSize: 19,
          lineHeight: 1.7,
          color: theme.ink,
          textAlign: 'center',
          placeholderKey: 'dressCode',
        },
        animate: { type: 'revealUp', duration: 1.1, delay: 0.12 },
      },
      ...swatches.map((fill, i): ElementSpec => ({
        type: 'shape',
        props: {
          x: 30 + i * 11,
          y: 206,
          w: 9,
          h: 36,
          shape: 'circle',
          fill,
          stroke: theme.accent,
          strokeWidth: 1,
        },
        // Stepped so the row assembles left to right rather than appearing.
        animate: { type: 'zoomIn', duration: 0.7, delay: 0.3 + i * 0.09 },
      })),
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 8. Location
// ---------------------------------------------------------------------------

interface AkLocationOptions {
  venue?: Copy;
  address?: Copy;
  timeLine?: Copy;
  mapHref?: string;
}

export function akLocation(options: AkLocationOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 340;

    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 6,
          y: 48,
          w: 88,
          h: 'auto',
          text: t({ kz: 'Мекен-жай', ru: 'Место' }, ctx),
          fontFamily: theme.display,
          fontSize: 29,
          letterSpacing: 1.6,
          lineHeight: 1.25,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0 },
      },
      {
        type: 'heading',
        props: {
          x: 8,
          y: 104,
          w: 84,
          h: 'auto',
          as: 'h3',
          text: t(options.venue ?? { kz: '«Салтанат» сарайы', ru: 'Дворец «Салтанат»' }, ctx),
          fontFamily: theme.display,
          fontSize: 30,
          fontWeight: 400,
          color: theme.ink,
          textAlign: 'center',
          placeholderKey: 'venueName',
        },
        animate: { type: 'revealUp', duration: 1.1, delay: 0.1 },
      },
      {
        type: 'text',
        props: {
          x: 12,
          y: 156,
          w: 76,
          h: 'auto',
          text: t(
            options.address ?? {
              kz: 'Астана қ., Тәуелсіздік даңғылы 12',
              ru: 'г. Астана, пр. Тәуелсіздік 12',
            },
            ctx,
          ),
          fontFamily: theme.body,
          fontSize: 15,
          lineHeight: 1.6,
          color: theme.muted,
          textAlign: 'center',
          placeholderKey: 'venueAddress',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0.18 },
      },
      {
        type: 'text',
        props: {
          x: 12,
          y: 208,
          w: 76,
          h: 24,
          text: t(options.timeLine ?? { kz: 'Басталуы: 18:00', ru: 'Начало: 18:00' }, ctx),
          fontFamily: theme.display,
          fontSize: 23,
          color: theme.accent,
          textAlign: 'center',
          placeholderKey: 'eventTime',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0.26 },
      },
      // A filled button, not an outlined one. Outlined on ivory is the weakest
      // control on the page and this is the second thing a guest needs to do.
      {
        type: 'button',
        props: {
          x: 24,
          y: 258,
          w: 52,
          h: 48,
          label: t({ kz: 'Картадан қарау', ru: 'Посмотреть на карте' }, ctx),
          action: options.mapHref ? { kind: 'map', href: options.mapHref } : { kind: 'map' },
          bgColor: deep(ctx),
          textColor: theme.paper,
          fontFamily: theme.body,
          fontSize: 15,
          fontWeight: 600,
          borderRadius: 999,
        },
        animate: { type: 'zoomIn', duration: 0.8, delay: 0.34 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 9. RSVP
// ---------------------------------------------------------------------------

export function akRsvp(): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 380;

    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 6,
          y: 48,
          w: 88,
          h: 'auto',
          text: t({ kz: 'Анкета', ru: 'Анкета' }, ctx),
          fontFamily: theme.display,
          fontSize: 29,
          letterSpacing: 1.6,
          lineHeight: 1.25,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0 },
      },
      // No second sentence here on purpose.
      //
      // The form renders its own title, its own deadline line and its own
      // explanation of personal links, so a paragraph above it made five
      // stacked messages before the guest reached a single control. The
      // reference puts one label and then the form.
      {
        type: 'rsvp-form',
        props: {
          x: 6,
          y: 104,
          w: 88,
          h: 236,
          // The section heading sits above; an empty title suppresses the
          // component's own so the guest does not read two of them.
          title: '',
          fontFamily: theme.body,
          bgColor: 'transparent',
          textColor: theme.ink,
          accentColor: deep(ctx),
          askPlusOne: true,
          askDietary: false,
          askChildren: false,
        },
        animate: { type: 'fadeUp', duration: 1, delay: 0.22 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 10. Wishes
// ---------------------------------------------------------------------------

export function akWishes(): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 600;

    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 6,
          y: 48,
          w: 88,
          h: 'auto',
          text: t({ kz: 'Тілектер', ru: 'Пожелания' }, ctx),
          fontFamily: theme.display,
          fontSize: 29,
          letterSpacing: 1.6,
          lineHeight: 1.25,
          color: theme.accent,
          textAlign: 'center',
        },
        animate: { type: 'revealUp', duration: 1, delay: 0 },
      },
      {
        type: 'wishes',
        props: {
          x: 6,
          y: 104,
          w: 88,
          h: 452,
          title: '',
          fontFamily: theme.body,
          // A faint wash rather than transparent: the wishes wall is the one
          // block a guest writes into, and it needs to read as a card sitting
          // on the paper, not as loose fields floating on it.
          bgColor: 'rgba(255,255,255,0.34)',
          textColor: theme.ink,
          accentColor: deep(ctx),
          allowAnonymous: true,
        },
        animate: { type: 'fadeUp', duration: 1, delay: 0.14 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}

// ---------------------------------------------------------------------------
// 11. Closing
// ---------------------------------------------------------------------------

export function akClosing(): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const HEIGHT = 560;

    const elements: ElementSpec[] = [
      {
        type: 'image',
        props: {
          x: -3,
          y: 0,
          w: 106,
          h: HEIGHT + 60,
          src: AK_OTAU_ASSETS.closing,
          objectFit: 'cover',
          borderRadius: 0,
          // Feathered head only: the page ends here, so the foot needs no fade.
          // Feathered at both ends: the page stops on the photograph, and a
          // hard cut from a night silhouette to ivory paper reads as a crop.
          maskFade: { top: 18, bottom: 4 },
          // Darkest in the middle band where the farewell line and the names
          // sit, easing off at both ends so the feathered head still reads as
          // the photograph emerging rather than as a grey block.
          overlayGradient: {
            from: 'rgba(24,16,12,0.10)',
            to: 'rgba(24,16,12,0.66)',
            angle: 180,
          },
          grade: { saturate: 88, brightness: 96 },
          parallax: 0.1,
          zIndex: 2,
        },
        animate: { type: 'kenBurns', duration: 10, delay: 0 },
      },
      {
        type: 'image',
        props: oyu({
          src: AK_OTAU_ASSETS.oyuMedallion,
          x: 36,
          y: 170,
          w: 28,
          h: 106,
          color: 'rgba(255,255,255,0.85)',
          z: 20,
          idle: { type: 'spin', duration: 60 },
        }),
        animate: { type: 'zoomIn', duration: 1.2, delay: 0.3 },
      },
      {
        type: 'text',
        props: {
          x: 8,
          y: 314,
          w: 84,
          h: 'auto',
          text: t({ kz: 'Сіздерді тойымызда күтеміз!', ru: 'Ждём вас на нашем тое!' }, ctx),
          fontFamily: theme.script,
          fontSize: 38,
          lineHeight: 1.3,
          color: theme.onPhoto,
          textAlign: 'center',
          textShadow: { x: 0, y: 1, blur: 12, color: 'rgba(0,0,0,0.5)' },
          zIndex: 22,
        },
        animate: { type: 'revealUp', duration: 1.2, delay: 0.5 },
      },
      {
        type: 'couple-names',
        props: {
          x: 8,
          y: 448,
          w: 84,
          h: 'auto',
          first: 'Айдар',
          second: 'Айсұлу',
          connector: ctx.locale === 'ru' ? 'и' : 'және',
          font: theme.display,
          fontSize: 17,
          color: 'rgba(255,255,255,0.9)',
          connectorColor: 'rgba(255,255,255,0.65)',
          stacked: false,
          zIndex: 22,
        },
        animate: { type: 'fade', duration: 1.4, delay: 0.7 },
      },
    ];

    return { elements, height: HEIGHT };
  };
}
