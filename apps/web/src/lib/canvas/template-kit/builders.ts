/**
 * The section vocabulary every template is assembled from.
 *
 * Each builder is deliberately opinionated about vertical rhythm — the caller
 * picks a theme and content, not spacing. That is what keeps twenty templates
 * looking composed rather than twenty separately-eyeballed layouts.
 *
 * Copy defaults are Kazakh-first with a Russian variant, because the product's
 * primary market writes Kazakh and every default here ends up on screen if a
 * host never edits the field.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };

const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

/** Full-bleed: 150% of the page width, starting a quarter-width off the left
 *  edge, so the element runs past both sides and the page crop finishes it. */
export const BLEED = { x: -25, w: 150 } as const;

interface HeroOptions {
  eyebrow?: Copy;
  first?: string;
  second?: string;
  dateLine?: Copy;
  height?: number;
}

/**
 * Opening screen: photograph, names, date. The photo is full-bleed and the
 * text sits on top of it, so `onPhoto` rather than `ink` is the text colour.
 */
export function hero(options: HeroOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme, assets } = ctx;
    const height = options.height ?? 620;
    const elements: ElementSpec[] = [];

    if (assets.heroBg) {
      elements.push({
        type: 'image',
        props: {
          ...BLEED,
          y: 0,
          h: height,
          src: assets.heroBg,
          objectFit: 'cover',
          borderRadius: 0,
          overlayColor: 'rgba(0,0,0,0.28)',
          placeholderKey: 'coverPhoto',
        },
      });
    }

    elements.push({
      type: 'text',
      props: {
        x: 8,
        y: 250,
        w: 84,
        h: 26,
        text: t(options.eyebrow ?? { kz: 'ҮЙЛЕНУ ТОЙЫ', ru: 'СВАДЬБА' }, ctx),
        fontFamily: theme.display,
        fontSize: 13,
        letterSpacing: 4,
        color: theme.onPhoto,
        textAlign: 'center',
        placeholderKey: 'heroTitle',
      },
    });

    elements.push({
      type: 'couple-names',
      props: {
        x: 6,
        y: 300,
        w: 88,
        h: 'auto',
        first: options.first ?? 'Айдар',
        second: options.second ?? 'Айсұлу',
        connector: '&',
        font: theme.script,
        fontSize: 52,
        color: theme.onPhoto,
        placeholderKey: 'coupleNames',
      },
    });

    elements.push({
      type: 'text',
      props: {
        x: 8,
        y: 470,
        w: 84,
        h: 24,
        text: t(options.dateLine ?? { kz: '15 МАМЫР 2027', ru: '15 МАЯ 2027' }, ctx),
        fontFamily: theme.display,
        fontSize: 14,
        letterSpacing: 3,
        color: theme.accent,
        textAlign: 'center',
        placeholderKey: 'eventDate',
      },
    });

    return { elements, height };
  };
}

interface ArchHeroOptions {
  eyebrow?: Copy;
  kicker?: Copy;
  first?: string;
  second?: string;
  dateLine?: Copy;
  height?: number;
}

/**
 * Opening screen built as a composition rather than a photo with text on it.
 *
 * The difference this section exists to close: competitor heroes are drawn
 * cards — a tinted ground, a gold arch frame, botanical sprigs breaking over
 * the frame, and the photograph cut into an arch so it belongs to the card
 * instead of sitting behind it. Ours was a rectangular stock photo with white
 * type laid on top, which is why the two read as different products.
 *
 * Layer order matters and is fixed here: ground → frame → photo → sprigs →
 * type. Sprigs sit above the frame so they overlap its lines, which is what
 * makes the decoration look grown rather than stamped.
 */
export function archHero(options: ArchHeroOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme, assets } = ctx;
    const height = options.height ?? 720;
    const elements: ElementSpec[] = [];

    // Ground: a soft vertical wash, not the page's flat paper, so the hero
    // reads as its own panel.
    elements.push({
      type: 'shape',
      props: {
        ...BLEED,
        y: 0,
        h: height,
        shape: 'rect',
        fill: theme.paper,
        opacity: 1,
      },
    });

    // Gold arch frame, inset from the page edges.
    elements.push({
      type: 'ornament',
      props: {
        x: 8,
        y: 34,
        w: 84,
        h: height - 150,
        ornamentId: 'arch-frame',
        src: '/assets/decorations/arch-frame.svg',
        color: theme.accent,
      },
    });

    // Photograph cut into an arch, graded down so it sits inside the palette
    // instead of shouting over it.
    if (assets.heroBg) {
      elements.push({
        type: 'image',
        props: {
          x: 22,
          y: 322,
          w: 56,
          h: 288,
          src: assets.heroBg,
          objectFit: 'cover',
          borderRadius: 0,
          maskShape: 'arch',
          grade: { saturate: 62, brightness: 98, contrast: 94, sepia: 12 },
          placeholderKey: 'couplePhoto',
        },
      });
    }

    // Botanical sprigs tucked into the upper corners, mirrored rather than
    // rotated so the pair reads as one symmetrical decoration.
    elements.push({
      type: 'ornament',
      props: {
        x: 1,
        y: 74,
        w: 22,
        h: 172,
        ornamentId: 'sprig',
        src: '/assets/decorations/sprig.svg',
        color: theme.accent,
      },
    });
    elements.push({
      type: 'ornament',
      props: {
        x: 77,
        y: 74,
        w: 22,
        h: 172,
        ornamentId: 'sprig',
        src: '/assets/decorations/sprig.svg',
        color: theme.accent,
        flipX: true,
      },
    });

    // Ruled label above the names.
    elements.push({
      type: 'text',
      props: {
        x: 16,
        y: 96,
        w: 68,
        h: 24,
        text: t(options.eyebrow ?? { kz: 'Үйлену тойға', ru: 'На свадьбу' }, ctx),
        fontFamily: theme.display,
        fontSize: 19,
        letterSpacing: 2,
        color: theme.ink,
        textAlign: 'center',
        placeholderKey: 'heroTitle',
      },
    });
    elements.push({
      type: 'ornament',
      props: {
        x: 30,
        y: 128,
        w: 40,
        h: 14,
        ornamentId: 'rule-diamond',
        src: '/assets/decorations/rule-diamond.svg',
        color: theme.accent,
      },
    });
    elements.push({
      type: 'text',
      props: {
        x: 16,
        y: 148,
        w: 68,
        h: 24,
        text: t(options.kicker ?? { kz: 'шақыру', ru: 'приглашение' }, ctx),
        fontFamily: theme.display,
        fontSize: 16,
        color: theme.muted,
        textAlign: 'center',
      },
    });

    // Names — gold, inside the arch, the focal point of the whole screen.
    elements.push({
      type: 'couple-names',
      props: {
        x: 24,
        y: 186,
        w: 52,
        h: 'auto',
        first: options.first ?? 'Айдар',
        second: options.second ?? 'Айсұлу',
        connector: '&',
        font: theme.script,
        fontSize: 40,
        color: theme.accent,
        connectorColor: theme.muted,
        placeholderKey: 'coupleNames',
      },
    });

    elements.push({
      type: 'text',
      props: {
        x: 16,
        y: height - 78,
        w: 68,
        h: 22,
        text: t(options.dateLine ?? { kz: '15 МАМЫР 2027', ru: '15 МАЯ 2027' }, ctx),
        fontFamily: theme.display,
        fontSize: 13,
        letterSpacing: 3,
        color: theme.ink,
        textAlign: 'center',
        placeholderKey: 'eventDate',
      },
    });

    return { elements, height };
  };
}

interface PaintedHeroOptions {
  eyebrow?: Copy;
  first?: string;
  second?: string;
  dateLine?: Copy;
  /** Natural aspect of the artwork (width / height). */
  ratio?: number;
}

/**
 * Hero built on a single painted background.
 *
 * This is how the competitors actually do it — toi.com.kz ships one
 * `hero-bg.webp` with its arch and florals already painted together — and it
 * beats assembling a composition from separate ornaments, because the artwork
 * is composed as a whole instead of arranged part by part.
 *
 * The artwork is placed at exactly 100% width rather than full-bleed: it is a
 * finished card, and cropping it would cut the botanicals off its outer edges.
 * The section height is derived from the image's own ratio so the arch is
 * never stretched. Nothing here draws a frame or a second arch — the painting
 * already is both.
 */
export function paintedHero(options: PaintedHeroOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme, assets, width } = ctx;
    const ratio = options.ratio ?? 848 / 1264;
    const height = Math.round(width / ratio);
    const elements: ElementSpec[] = [];

    if (assets.heroBg) {
      elements.push({
        type: 'image',
        props: {
          x: 0,
          y: 0,
          w: 100,
          h: height,
          src: assets.heroBg,
          objectFit: 'cover',
          borderRadius: 0,
        },
        animate: false as const,
      });
    }

    // Type sits inside the arch's open middle. Offsets are fractions of the
    // section height so they track the artwork if its ratio changes.
    const at = (f: number) => Math.round(height * f);

    elements.push({
      type: 'text',
      props: {
        x: 26,
        y: at(0.35),
        w: 48,
        h: 20,
        text: t(options.eyebrow ?? { kz: 'ҮЙЛЕНУ ТОЙЫНА ШАҚЫРУ', ru: 'ПРИГЛАШЕНИЕ НА СВАДЬБУ' }, ctx),
        fontFamily: theme.body,
        fontSize: 9,
        letterSpacing: 2.6,
        color: theme.muted,
        textAlign: 'center',
        placeholderKey: 'heroTitle',
      },
    });

    elements.push({
      type: 'couple-names',
      props: {
        x: 20,
        y: at(0.43),
        w: 60,
        h: 'auto',
        first: options.first ?? 'Айдар',
        second: options.second ?? 'Айсұлу',
        connector: 'және',
        font: theme.display,
        fontSize: 38,
        color: theme.ink,
        connectorColor: theme.accent,
        italic: true,
        stacked: true,
        placeholderKey: 'coupleNames',
      },
    });

    elements.push({
      type: 'text',
      props: {
        x: 22,
        y: at(0.79),
        w: 56,
        h: 20,
        text: t(options.dateLine ?? { kz: '15 МАМЫР 2027', ru: '15 МАЯ 2027' }, ctx),
        fontFamily: theme.body,
        fontSize: 10,
        letterSpacing: 3,
        color: theme.ink,
        textAlign: 'center',
        placeholderKey: 'eventDate',
      },
    });

    return { elements, height };
  };
}

/** Section break using a painted divider strip instead of a drawn ornament. */
export function paintedDivider(ratio = 2064 / 512): SectionBuilder {
  return (ctx): SectionResult => {
    const height = Math.round(ctx.width / ratio);
    return {
      elements: ctx.assets.divider
        ? [
            {
              type: 'image',
              props: {
                x: 0,
                y: 0,
                w: 100,
                h: height,
                src: ctx.assets.divider,
                objectFit: 'cover',
                borderRadius: 0,
              },
              animate: false as const,
      },
          ]
        : [],
      height,
    };
  };
}

interface PaintedClosingOptions {
  line?: Copy;
  ratio?: number;
}

/** Sign-off over the painted garland. */
export function paintedClosing(options: PaintedClosingOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme, assets, width } = ctx;
    const ratio = options.ratio ?? 848 / 1264;
    const height = Math.round(width / ratio);
    const elements: ElementSpec[] = [];

    if (assets.closingBg) {
      elements.push({
        type: 'image',
        props: {
          x: 0,
          y: 0,
          w: 100,
          h: height,
          src: assets.closingBg,
          objectFit: 'cover',
          borderRadius: 0,
        },
        animate: false as const,
      });
    }

    elements.push({
      type: 'heading',
      props: {
        x: 16,
        y: Math.round(height * 0.3),
        w: 68,
        h: 'auto',
        as: 'h3',
        text: t(
          options.line ?? {
            kz: 'Тойымыздың қадірлі қонағы болыңыздар!',
            ru: 'Будем счастливы видеть вас на нашем празднике!',
          },
          ctx
        ),
        fontFamily: theme.display,
        fontSize: 21,
        fontWeight: 400,
        lineHeight: 1.45,
        italic: true,
        color: theme.ink,
        textAlign: 'center',
      },
    });

    return { elements, height };
  };
}

/**
 * Ornamental break between sections.
 *
 * Sections separated by nothing but whitespace read as a stack of unrelated
 * blocks; one recurring motif between them is what makes a long scroll feel
 * like a single card. Competitors put a drawn divider at every seam.
 */
export function divider(height = 92): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'ornament',
        props: {
          x: 32,
          y: Math.round(height / 2) - 9,
          w: 36,
          h: 18,
          ornamentId: 'kz-band',
          src: '/assets/decorations/kz-band.svg',
          color: ctx.theme.accent,
        },
      },
    ],
    height,
  });
}

interface SteppeHeroOptions {
  eyebrow?: Copy;
  first?: string;
  second?: string;
  dateLine?: Copy;
  height?: number;
}

/**
 * "Steppe" hero — the first template that is a composition rather than a page.
 *
 * Deliberately not a copy of the competitors' arch-and-roses. Their decoration
 * is watercolour florals, which neither code nor a blind prompt can produce
 * well. This one is built from қошқар мүйіз — the Kazakh ram's-horn ornament —
 * which is symmetrical, geometric and constructed by mirroring, and therefore
 * something drawing-by-coordinates does *better* than freehand. It is also the
 * one thing none of the competitors use: they all run on generic European
 * florals, so this reads as Kazakh rather than as a translated wedding card.
 *
 * Layers: painted ground → inner rule frame → arch photo → crest → type.
 */
export function steppeHero(options: SteppeHeroOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme, assets } = ctx;
    const height = options.height ?? 760;
    const elements: ElementSpec[] = [];

    // No ground element here on purpose: when a recipe supplies `ground`, the
    // composer paints it behind the *whole* document. Drawing it again for
    // this section stacked two copies of the same wash and left a visible
    // tonal step at the hero's bottom edge.

    // Inner hairline frame. Two rules rather than an ornate corner: a plain
    // frame executed cleanly beats a decorated one executed badly.
    const inset = 7;
    const frameTop = 26;
    const frameH = height - 52;
    for (const [i, gap] of [0, 5].entries()) {
      elements.push({
        type: 'shape',
        props: {
          x: inset + gap,
          y: frameTop + gap,
          w: 100 - (inset + gap) * 2,
          h: frameH - gap * 2,
          shape: 'rect',
          fill: 'transparent',
          stroke: theme.accent,
          strokeWidth: 1,
          opacity: i === 0 ? 0.85 : 0.4,
        },
      });
    }

    elements.push({
      type: 'text',
      props: {
        x: 14,
        y: 74,
        w: 72,
        h: 22,
        text: t(options.eyebrow ?? { kz: 'ҮЙЛЕНУ ТОЙЫНА ШАҚЫРУ', ru: 'ПРИГЛАШЕНИЕ НА СВАДЬБУ' }, ctx),
        fontFamily: theme.body,
        fontSize: 10,
        letterSpacing: 3.4,
        color: theme.muted,
        textAlign: 'center',
        placeholderKey: 'heroTitle',
      },
    });

    // Crest sits directly above the names and anchors the composition.
    elements.push({
      type: 'ornament',
      props: {
        x: 33,
        y: 112,
        w: 34,
        h: 62,
        ornamentId: 'kz-crest',
        src: '/assets/decorations/kz-crest.svg',
        color: theme.accent,
      },
    });

    // Names: italic serif in gold. Stacked so a long Kazakh pair cannot run
    // out of the frame.
    elements.push({
      type: 'couple-names',
      props: {
        x: 12,
        y: 196,
        w: 76,
        h: 'auto',
        first: options.first ?? 'Айдар',
        second: options.second ?? 'Айсұлу',
        connector: 'және',
        font: theme.display,
        fontSize: 42,
        color: theme.ink,
        connectorColor: theme.accent,
        italic: true,
        stacked: true,
        placeholderKey: 'coupleNames',
      },
    });

    elements.push({
      type: 'ornament',
      props: {
        x: 30,
        y: 372,
        w: 40,
        h: 18,
        ornamentId: 'kz-band',
        src: '/assets/decorations/kz-band.svg',
        color: theme.accent,
      },
    });

    elements.push({
      type: 'text',
      props: {
        x: 14,
        y: 404,
        w: 72,
        h: 22,
        text: t(options.dateLine ?? { kz: '15 МАМЫР 2027', ru: '15 МАЯ 2027' }, ctx),
        fontFamily: theme.body,
        fontSize: 11,
        letterSpacing: 3.4,
        color: theme.ink,
        textAlign: 'center',
        placeholderKey: 'eventDate',
      },
    });

    if (assets.heroBg) {
      elements.push({
        type: 'image',
        props: {
          x: 26,
          y: 452,
          w: 48,
          h: 250,
          src: assets.heroBg,
          objectFit: 'cover',
          borderRadius: 0,
          maskShape: 'arch',
          grade: { saturate: 55, brightness: 99, contrast: 92, sepia: 14 },
          placeholderKey: 'couplePhoto',
        },
      });
    }

    return { elements, height };
  };
}

interface GreetingOptions {
  title?: Copy;
  body?: Copy;
}

/** Address to the guests: a heading, a rule, and a paragraph. */
export function greeting(options: GreetingOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const elements: ElementSpec[] = [
      {
        type: 'divider',
        props: { x: 42, y: 48, w: 16, h: 1, color: theme.accent, thickness: 1, style: 'solid' },
      },
      {
        type: 'heading',
        props: {
          x: 10,
          y: 82,
          w: 80,
          h: 'auto',
          as: 'h2',
          text: t(options.title ?? { kz: 'Құрметті қонақтар!', ru: 'Дорогие гости!' }, ctx),
          fontFamily: theme.display,
          fontSize: 27,
          fontWeight: 400,
          color: theme.ink,
          textAlign: 'center',
        },
      },
      {
        type: 'text',
        props: {
          x: 12,
          y: 140,
          w: 76,
          h: 'auto',
          text: t(
            options.body ?? {
              kz: 'Сіздерді ұлымыз бен келінқызымыздың өміріндегі ең маңызды сәтке — үйлену тойына шақырамыз. Бізбен бірге осы қуанышты бөлісуіңізді сұраймыз.',
              ru: 'Приглашаем вас разделить с нами самый важный день в жизни наших детей. Будем счастливы видеть вас на нашем торжестве.',
            },
            ctx
          ),
          fontFamily: theme.display,
          fontSize: 18,
          lineHeight: 1.6,
          color: theme.ink,
          textAlign: 'center',
          placeholderKey: 'greetingText',
        },
      },
    ];

    return { elements, height: 300 };
  };
}

interface CalendarOptions {
  title?: Copy;
  targetIso?: string;
}

/** Month grid with the event day ringed. */
export function calendar(options: CalendarOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 10,
          y: 40,
          w: 80,
          h: 24,
          text: t(options.title ?? { kz: 'ТОЙ САЛТАНАТЫ', ru: 'ДЕНЬ ТОРЖЕСТВА' }, ctx),
          fontFamily: theme.display,
          fontSize: 13,
          letterSpacing: 3,
          color: theme.muted,
          textAlign: 'center',
        },
      },
      {
        type: 'calendar',
        props: {
          x: 14,
          y: 84,
          w: 72,
          h: 300,
          targetIso: options.targetIso,
          fontFamily: theme.body,
          fontSize: 14,
          color: theme.ink,
          accentColor: theme.accent,
          markStyle: 'ring',
          showMonthTitle: true,
          showWeekdays: true,
          placeholderKey: 'eventDate',
        },
      },
    ];

    return { elements, height: 430 };
  };
}

interface CountdownOptions {
  title?: Copy;
  targetIso?: string;
}

/** "Time remaining" strip. */
export function countdown(options: CountdownOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 10,
          y: 30,
          w: 80,
          h: 22,
          text: t(options.title ?? { kz: 'Тойға дейін', ru: 'До торжества' }, ctx),
          fontFamily: theme.body,
          fontSize: 13,
          letterSpacing: 2,
          color: theme.muted,
          textAlign: 'center',
        },
      },
      {
        type: 'countdown',
        props: {
          x: 8,
          y: 70,
          w: 84,
          h: 'auto',
          targetIso: options.targetIso,
          fontFamily: theme.display,
          fontSize: 24,
          color: theme.ink,
          accentColor: theme.accent,
          showLabels: true,
        },
      },
    ];

    return { elements, height: 210 };
  };
}

interface LocationOptions {
  title?: Copy;
  venue?: Copy;
  address?: Copy;
  timeLine?: Copy;
  mapHref?: string;
}

/** Venue, time, and a button that opens the map. */
export function location(options: LocationOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const elements: ElementSpec[] = [
      {
        type: 'text',
        props: {
          x: 10,
          y: 40,
          w: 80,
          h: 22,
          text: t(options.title ?? { kz: 'ӨТЕТІН ОРНЫ', ru: 'МЕСТО ПРОВЕДЕНИЯ' }, ctx),
          fontFamily: theme.display,
          fontSize: 13,
          letterSpacing: 3,
          color: theme.muted,
          textAlign: 'center',
        },
      },
      {
        type: 'heading',
        props: {
          x: 10,
          y: 76,
          w: 80,
          h: 'auto',
          as: 'h3',
          text: t(options.venue ?? { kz: '«Салтанат» сарайы', ru: 'Дворец «Салтанат»' }, ctx),
          fontFamily: theme.display,
          fontSize: 26,
          fontWeight: 400,
          color: theme.ink,
          textAlign: 'center',
          placeholderKey: 'venueName',
        },
      },
      {
        type: 'text',
        props: {
          x: 12,
          y: 122,
          w: 76,
          h: 'auto',
          text: t(
            options.address ?? { kz: 'Астана қ., Тәуелсіздік даңғылы 12', ru: 'г. Астана, пр. Тәуелсіздік 12' },
            ctx
          ),
          fontFamily: theme.display,
          fontSize: 18,
          lineHeight: 1.5,
          color: theme.ink,
          textAlign: 'center',
          placeholderKey: 'venueAddress',
        },
      },
      {
        type: 'text',
        props: {
          x: 12,
          y: 176,
          w: 76,
          h: 22,
          text: t(options.timeLine ?? { kz: 'Басталуы: 18:00', ru: 'Начало: 18:00' }, ctx),
          fontFamily: theme.display,
          fontSize: 20,
          color: theme.accent,
          textAlign: 'center',
          placeholderKey: 'eventTime',
        },
      },
      {
        type: 'button',
        props: {
          x: 27,
          y: 220,
          w: 46,
          h: 44,
          label: t({ kz: 'Картаны ашу', ru: 'Открыть карту' }, ctx),
          action: options.mapHref ? { kind: 'map', href: options.mapHref } : { kind: 'map' },
          bgColor: 'transparent',
          textColor: theme.ink,
          borderColor: theme.accent,
          borderWidth: 1,
          fontFamily: theme.display,
          fontSize: 18,
          fontWeight: 400,
          borderRadius: 999,
        },
      },
    ];

    return { elements, height: 310 };
  };
}

interface DressCodeOptions {
  title?: Copy;
  body?: Copy;
  height?: number;
}

/** Dress code over a photograph. */
export function dressCode(options: DressCodeOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme, assets } = ctx;
    const height = options.height ?? 340;
    const onPhoto = Boolean(assets.dressCodeBg);
    const elements: ElementSpec[] = [];

    if (assets.dressCodeBg) {
      elements.push({
        type: 'image',
        props: {
          ...BLEED,
          y: 0,
          h: height,
          src: assets.dressCodeBg,
          objectFit: 'cover',
          borderRadius: 0,
          overlayColor: 'rgba(0,0,0,0.35)',
        },
      });
    }

    elements.push({
      type: 'heading',
      props: {
        x: 10,
        y: 96,
        w: 80,
        h: 'auto',
        as: 'h3',
        text: t(options.title ?? { kz: 'DRESS CODE', ru: 'DRESS CODE' }, ctx),
        fontFamily: theme.display,
        fontSize: 20,
        fontWeight: 400,
        letterSpacing: 4,
        color: onPhoto ? theme.onPhoto : theme.ink,
        textAlign: 'center',
        placeholderKey: 'dressCode',
      },
    });

    elements.push({
      type: 'text',
      props: {
        x: 14,
        y: 150,
        w: 72,
        h: 'auto',
        text: t(
          options.body ?? {
            kz: 'Тойға сәнді әрі салтанатты киінуіңізді сұраймыз. Негізгі түстер: алтын, бордо, крем.',
            ru: 'Просим вас выбрать нарядный вечерний образ. Основные цвета: золото, бордо, крем.',
          },
          ctx
        ),
        fontFamily: theme.display,
        fontSize: 18,
        lineHeight: 1.6,
        color: onPhoto ? theme.onPhoto : theme.ink,
        textAlign: 'center',
      },
    });

    return { elements, height };
  };
}

interface RsvpOptions {
  title?: Copy;
}

/** Response form. */
export function rsvp(options: RsvpOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme } = ctx;
    const elements: ElementSpec[] = [
      {
        type: 'divider',
        props: { x: 42, y: 44, w: 16, h: 1, color: theme.accent, thickness: 1, style: 'solid' },
      },
      {
        type: 'rsvp-form',
        props: {
          x: 8,
          y: 96,
          w: 84,
          h: 280,
          fontFamily: theme.body,
          bgColor: 'transparent',
          textColor: theme.ink,
          accentColor: theme.accent,
          askPlusOne: true,
          askChildren: true,
          askDietary: false,
        },
      },
    ];

    return { elements, height: 420 };
  };
}

interface ClosingOptions {
  line?: Copy;
  height?: number;
}

/** Sign-off over a photograph. */
export function closing(options: ClosingOptions = {}): SectionBuilder {
  return (ctx): SectionResult => {
    const { theme, assets } = ctx;
    const height = options.height ?? 280;
    const onPhoto = Boolean(assets.closingBg);
    const elements: ElementSpec[] = [];

    if (assets.closingBg) {
      elements.push({
        type: 'image',
        props: {
          ...BLEED,
          y: 0,
          h: height,
          src: assets.closingBg,
          objectFit: 'cover',
          borderRadius: 0,
          overlayColor: 'rgba(0,0,0,0.32)',
        },
      });
    }

    elements.push({
      type: 'heading',
      props: {
        x: 10,
        y: 110,
        w: 80,
        h: 'auto',
        as: 'h3',
        text: t(
          options.line ?? {
            kz: 'Тойымыздың қадірлі қонағы болыңыздар!',
            ru: 'Будем счастливы видеть вас на нашем празднике!',
          },
          ctx
        ),
        fontFamily: theme.display,
        fontSize: 21,
        fontWeight: 400,
        lineHeight: 1.4,
        color: onPhoto ? theme.onPhoto : theme.ink,
        textAlign: 'center',
      },
    });

    return { elements, height };
  };
}

/**
 * Floating music toggle. Pinned to the viewport rather than the page, so it
 * stays reachable while the guest scrolls.
 */
export function floatingMusic(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      {
        type: 'music',
        props: {
          x: 74,
          y: 0,
          w: 22,
          h: 48,
          accentColor: ctx.theme.accent,
          autoPlayMuted: true,
          zIndex: 9990,
          // Bottom-LEFT on purpose: the app pins its own share controls to
          // the bottom-right, and a template element there lands on top of them.
          // 92px used to clear a pinned action bar that no longer exists; the
          // pill now sits where a floating control belongs.
          pinned: { corner: 'bottom-left', offsetX: 16, offsetY: 20 },
        },
      },
    ],
    // Pinned elements are lifted out of the flow on the guest page, so they
    // must not reserve vertical space.
    height: 0,
  });
}
