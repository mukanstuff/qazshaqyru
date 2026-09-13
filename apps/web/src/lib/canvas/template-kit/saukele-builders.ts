/**
 * Sections for «Сәукеле» — қыз ұзату.
 *
 * The second template in this category, and it has to differ from «Сырмақ» at
 * the instance, not at the skeleton: the owner's rule is that the reference
 * services keep one structure and change the wrapper. So the order of screens
 * is the measured canonical one, and what changes is where the palette comes
 * from, what is photographed, and which devices carry the page.
 *
 * Point of difference: the palette is sampled from zerger silver set with
 * feruza. «Сырмақ» took its colours from a felt carpet and carries no metal at
 * all; every other template in the catalogue is cream and gold. This is the
 * first cool accent in the catalogue, and it is not invented — silver with
 * turquoise is a real pairing in Kazakh silversmithing, and the saukele is
 * what toi signs this category with (`docs/visual-register.md` §4).
 *
 * Register is the light paper one, which is measured as the convention for
 * wedding and ұзату. The dark jewel register is forbidden by the owner; see
 * the warning at the top of `visual-register.md`.
 *
 * Video: the hero carries a clip, which is the one place both reference
 * services put video (14 of 14 at toi, all `class="hero-video"`, see
 * `design-vocabulary.md` §3.20). It is decoration: the still photograph lies
 * underneath as its own element, so a clip that will not load costs nothing.
 */
import type { ElementSpec, SectionBuilder, SectionContext, SectionResult } from './types';

type Copy = { kz: string; ru: string };
const t = (c: Copy, ctx: SectionContext) => (ctx.locale === 'ru' ? c.ru : c.kz);

const A = {
  heroVideo: '/assets/templates/saukele/hero.webm',
  heroPoster: '/assets/templates/saukele/hero-poster.webp',
  saukele: '/assets/templates/saukele/hero-saukele.webp',
  zerger: '/assets/templates/saukele/story-zerger.webp',
  ground: '/assets/templates/saukele/ground-silk.webp',
  medallion: '/assets/templates/saukele/oyu-medallion.png',
  band: '/assets/templates/saukele/oyu-band.png',
  corner: '/assets/templates/saukele/oyu-corner.png',
  filigree: '/assets/templates/saukele/oyu-filigree.png',
} as const;

/**
 * Six sizes with the break between `lead` and `head`.
 *
 * Authored at the reference width of 430 as 17 / 20 / 24 / 32 / 46 / 58 and
 * scaled by 390/430. Top to bottom is 3.5x against a measured median of 3.6.
 *
 * `lead` is 27 rather than 29 so the break into `head` is 1.56x. The scale
 * shipped with 29, which makes the largest step 1.45x, and the catalogue gate
 * wants at least 1.5 — a ramp of even steps is what makes a page read as one
 * undifferentiated block of type, and the whole point of this scale is the
 * jump between the lead and the heading.
 */
const T = {
  cap: 15,
  small: 18,
  body: 22,
  lead: 27,
  head: 42,
  name: 53,
} as const;

/** Three content anchors. Decor lives outside them, on the bleed rail. */
const X = { left: 31, mid: 50, right: 69 } as const;

/**
 * One line of `head()`, in px — 42 × 1.18, rounded up.
 *
 * Sections here are hand-placed, so whatever sits under a heading has to be
 * told how tall that heading is. Two of the Kazakh headings wrap: measured in
 * the browser against the 328px column, «Құрметті қонақтар!» is 387px wide and
 * «Қатысуыңызды растаңыз» 498px. Both were placed as if they were one line —
 * the greeting paragraph started 15px above the foot of its own heading and
 * then ran 49px past the bottom of the white panel.
 */
const HEAD_LINE = 50;

const silver = (ctx: SectionContext) => ctx.theme.accentDeep ?? ctx.theme.muted;

/**
 * What lifts type off pale footage.
 *
 * Measured on toi's ұзату heroes, live: the eyebrow carries
 * `0 2px 6px rgba(255,255,255,.6)` and the name `0 3px 10px rgba(255,255,255,.7)`
 * — a white glow, not a dark scrim. Not one of their hero sections paints an
 * overlay over the artwork at all; the type is dark and saturated and the
 * picture is left alone.
 *
 * Measured on ours before this existed: against the frame under it, the date in
 * silver ran 1.14:1 at worst and 3.2:1 at best — the same lightness as the
 * dress behind it. Contrast alone does not explain it either: the caption was
 * already ink at 5.1:1 and still read badly, because 15px of letterspaced
 * capitals over folds and a ribbon is fighting texture, not tone. The glow is
 * what answers that.
 */
const GLOW = { x: 0, y: 2, blur: 9, color: 'rgba(255,255,255,0.8)' } as const;

/**
 * The same device for small type, tighter.
 *
 * A 9px blur builds a halo around a 53px name and nothing at all around a
 * letterspaced caption whose strokes are one pixel wide — measured, the
 * caption's contrast against its immediate surroundings did not move (3.36:1
 * at the tenth percentile, before and after). Half the blur at nearly full
 * opacity sits close enough to the stroke to separate it.
 *
 * Their captions are also simply bigger: toi sets the hero eyebrow at 26-32px
 * against our 15. Hence the hero one goes to 18 as well — the glow cannot make
 * up for type that is half the size it should be.
 */
const GLOW_TIGHT = { x: 0, y: 1, blur: 4, color: 'rgba(255,255,255,0.95)' } as const;

/** Letterspaced capitals. Domain sets them narrow, which suits the silver. */
function cap(
  ctx: SectionContext,
  copy: Copy,
  y: number,
  color?: string,
  onPhoto = false,
  size: number = T.cap,
): ElementSpec {
  return {
    type: 'text',
    props: {
      x: 10,
      y,
      w: 80,
      h: 'auto',
      text: t(copy, ctx),
      fontFamily: 'DomainDisplay',
      fontSize: size,
      fontWeight: 400,
      color: color ?? silver(ctx),
      textAlign: 'center',
      lineHeight: 1.4,
      letterSpacing: 3.4,
      ...(onPhoto ? { textShadow: GLOW_TIGHT } : {}),
    },
    animate: { type: 'fade', duration: 2.4 },
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
      fontFamily: 'DomainDisplay',
      fontSize: T.head,
      fontWeight: 400,
      color: color ?? ctx.theme.ink,
      textAlign: 'center',
      lineHeight: 1.18,
      letterSpacing: 0.5,
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
 * The medallion, reused at three scales and four rotations.
 *
 * `spin` goes on exactly one instance on the whole page. Every one of the 45
 * infinite rotations in the reference set is on an image, one per document, and
 * a page with four turning ornaments reads as a screensaver.
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
      tint: silver(ctx),
      rotation: opts.rotation,
      ...(opts.opacity !== undefined ? { opacity: opts.opacity } : {}),
      ...(opts.spin ? { idle: { type: 'spin', duration: 30 } } : {}),
    },
    // Opacity only, never a transform: a tinted ornament is a background colour
    // behind a mask, and an entrance that promotes the layer paints the whole
    // box instead of the silhouette. That is the faint rectangle bug.
    animate: { type: 'fade', duration: 2.0 },
  };
}

/**
 * The band, wider than the page on purpose — both edges cut it.
 *
 * 118, not 112: the reference set runs its widest bleed 28px or more past each
 * edge, and at 112 this one cut only 23px, which reads as a band that happens
 * to be slightly too wide rather than one deliberately running off the page.
 */
function band(ctx: SectionContext, y: number, w = 118, flip = false): ElementSpec {
  return {
    type: 'image',
    props: {
      x: (100 - w) / 2,
      y,
      w,
      // 1370x168 in a 460-wide box. An ornament box that does not match the
      // file's aspect wastes space at best and used to crop it at worst.
      h: 56,
      src: A.band,
      alt: '',
      objectFit: 'contain',
      borderRadius: 0,
      tint: silver(ctx),
      opacity: 0.85,
      ...(flip ? { rotation: 180 } : {}),
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
      tint: silver(ctx),
      rotation,
      opacity: opts.opacity ?? 0.4,
    },
    // Corners and filigree do not animate. The composer animates everything it
    // is not told to leave alone, which put 97% of this page on an entrance
    // against a measured 38-89% in the reference set — every piece of decor
    // arriving on its own cue is what makes a page feel like a slideshow.
    animate: false,
  };
}

function filigree(ctx: SectionContext, y: number, w = 46, opacity = 0.7): ElementSpec {
  return {
    type: 'image',
    props: {
      x: (100 - w) / 2,
      y,
      w,
      // 1332x318, i.e. 4.19:1 — the box follows the file.
      h: Math.round(((w / 100) * 390) / 4.19),
      src: A.filigree,
      alt: '',
      objectFit: 'contain',
      borderRadius: 0,
      tint: ctx.theme.accent,
      opacity,
    },
    animate: false,
  };
}

/** A translucent plate so type keeps its contrast over the silk ground. */
function panel(ctx: SectionContext, y: number, h: number, w = 88): ElementSpec {
  return {
    type: 'shape',
    props: {
      x: (100 - w) / 2,
      y,
      w,
      h,
      shape: 'rect',
      fill: 'rgba(255,255,255,0.62)',
      radius: 4,
      stroke: 'transparent',
      strokeWidth: 0,
    },
    // Surfaces never animate: a plate sliding out from under its own text reads
    // as a loading failure. Measured — not one of the 954 reference components
    // animates a shape. This comment stood here for a week with no
    // `animate: false` under it, and the composer animates whatever is not
    // told otherwise, so both panels had an entrance.
    animate: false,
  };
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------

export function saukeleHero(options: { bride?: string } = {}): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      /*
       * The still lies under the clip, not inside it.
       *
       * `video-bg` renders nothing at all when `src` is empty, so a poster
       * attribute cannot carry the screen on its own. The photograph is its own
       * element underneath: if the clip is missing, blocked by an autoplay
       * policy or simply slow, the hero is still a composed frame.
       */
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
          // `bottom`, not `{ edge, size }` — the schema has no such keys, Zod
          // stripped both, and the hero shipped with no fade at all.
          maskFade: { bottom: 26 },
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
          // Looping is their convention, and this clip was shot for it: the
          // camera is locked and the only motion is drifting petals, so the
          // seam has nothing to catch on.
          loop: true,
          opacity: 1,
        },
      },
      corner(ctx, 8, { side: 'right', w: 30, opacity: 0.5 }),
      /*
       * Short, and bigger than the other eyebrows.
       *
       * toi's hero eyebrow is two words at 26-32px; ours was a whole sentence
       * at 15, and the sentence is the reason it could not be read — measured
       * at 18px it runs 352px against a 312px column and wraps onto the name.
       * The invitation is already extended in the greeting two screens down
       * («Қызымыз Аружанды ұзату тойымызға шақырамыз»), so the hero only has
       * to name the occasion.
       */
      /*
       * The type lives in the sky, not on the dress.
       *
       * Measured across the frame in 20px bands: y 120-275 is empty wash —
       * fifth-percentile luminance 0.80-0.85 and local texture 0.005-0.011.
       * Where this block used to sit, y 440-680, the same numbers are 0.41-0.67
       * and 0.033-0.086: six to fifteen times busier, with real dark pixels in
       * it. No amount of glow wins that; a glow separates type from a quiet
       * ground, it cannot separate it from folds and a ribbon.
       *
       * It is also how the reference set composes: their heroes keep the top
       * two thirds deliberately empty and put the subject in the bottom third,
       * with the names in the empty part (design-vocabulary.md §3.20, §3.22).
       * Ours has the bride full height, so the free field is the band of sky
       * between the blossom branches and the arch — 155px, which is exactly
       * what the eyebrow, the name and the date need.
       */
      filigree(ctx, 116, 24, 0.85),
      cap(ctx, { kz: 'ҚЫЗ ҰЗАТУ ТОЙЫ', ru: 'ҚЫЗ ҰЗАТУ' }, 150, ctx.theme.ink, true, T.small),
      {
        type: 'text',
        props: {
          x: 8,
          y: 184,
          w: 84,
          h: 'auto',
          text: options.bride ?? 'Аружан',
          fontFamily: 'DomainDisplay',
          fontSize: T.name,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.05,
          letterSpacing: 1.5,
          textShadow: GLOW,
          placeholderKey: 'brideName',
          editableByEndUser: true,
          editableProperties: ['text', 'color', 'fontSize'],
        },
        animate: { type: 'letters', duration: 2.8, delay: 0.2 },
      },
      {
        type: 'text',
        props: {
          x: 15,
          y: 254,
          w: 70,
          h: 'auto',
          text: '15 . 05 . 2027',
          fontFamily: 'DomainDisplay',
          fontSize: T.small,
          fontWeight: 400,
          // Ink, not silver. Measured against the frame behind it, silver ran
          // 1.14:1 at worst — the date and the dress were the same lightness.
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

export function saukeleBand(y = 24): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [band(ctx, y)],
    height: 100,
  });
}

// ---------------------------------------------------------------------------
// 3. Greeting
// ---------------------------------------------------------------------------

export function saukeleGreeting(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      panel(ctx, 30, 520),
      medallion(ctx, 58, { x: 42, w: 16, rotation: 18, opacity: 0.75 }),
      head(ctx, { kz: 'Құрметті қонақтар!', ru: 'Дорогие гости!' }, 148),
      body(
        ctx,
        {
          kz: 'Қызымыз Аружанды ұзату тойымызға шақырамыз. Осы қуанышты күнді бізбен бірге бөліссеңіз, бақытымыз еселене түседі.',
          ru: 'Приглашаем вас на ұзату нашей дочери Аружан. Разделите с нами этот день — и наша радость станет полнее.',
        },
        148 + 2 * HEAD_LINE + 30,
        72,
        T.body,
      ),
    ],
    height: 580,
  });
}

// ---------------------------------------------------------------------------
// 4. Saukele — the object the category is signed with
// ---------------------------------------------------------------------------

export function saukeleObject(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      /*
       * The arch, offset from the axis.
       *
       * 44 of 53 toi templates set type or a block off the centre line, and a
       * centred photograph under centred type is the one arrangement every
       * reference card avoids. The medallion holds the empty side so the
       * column does not look like a mistake.
       */
      {
        type: 'image',
        props: {
          x: 34,
          y: 40,
          w: 62,
          h: 470,
          src: A.saukele,
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
      medallion(ctx, 300, { x: -2, w: 30, rotation: 342, opacity: 0.5 }),
      /*
       * The caption sits ON the photograph, not under it.
       *
       * Type over photography is the device the reference set leans on hardest
       * — the gate wants six such blocks and this page had three, all of them
       * on the hero. The foot of this frame is white silk, so the type is ink
       * and silver rather than the `onPhoto` near-white, which would vanish.
       */
      {
        type: 'text',
        props: {
          x: 36,
          y: 384,
          w: 58,
          h: 'auto',
          text: t({ kz: 'Сәукеле', ru: 'Сәукеле' }, ctx),
          fontFamily: 'Shelley',
          fontSize: T.head,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: 0,
          textShadow: GLOW,
        },
        animate: { type: 'fade', duration: 2.6 },
      },
      {
        type: 'text',
        props: {
          x: 36,
          y: 444,
          w: 58,
          h: 'auto',
          text: t({ kz: 'АҚ ЖОЛ ТІЛЕП', ru: 'С БЛАГОСЛОВЕНИЕМ' }, ctx),
          fontFamily: 'DomainDisplay',
          fontSize: T.cap,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'center',
          lineHeight: 1.4,
          letterSpacing: 3.4,
          textShadow: GLOW_TIGHT,
        },
        animate: { type: 'fade', duration: 2.4 },
      },
    ],
    height: 560,
  });
}

// ---------------------------------------------------------------------------
// 5. Hosts
// ---------------------------------------------------------------------------

export function saukeleHosts(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      /*
       * The one screen that is not built on the centre line.
       *
       * Everything else here is centred, and a page where every block shares
       * one axis reads as a list. 44 of 53 reference cards hang at least one
       * block off the axis; the gate asks for a text block at least 63px from
       * the centre and this page had none. The label and the family name are
       * left-hung against the oval on the right, which is the arrangement the
       * reference set uses for exactly this pairing.
       */
      {
        type: 'image',
        props: {
          x: 36,
          y: 44,
          w: 58,
          h: 300,
          src: A.zerger,
          alt: '',
          objectFit: 'cover',
          borderRadius: 0,
          maskShape: 'oval',
          opacity: 0.96,
        },
        animate: { type: 'fade', duration: 2.6 },
      },
      {
        type: 'text',
        props: {
          x: 6,
          y: 380,
          w: 46,
          h: 'auto',
          text: t({ kz: 'ТОЙ ИЕЛЕРІ', ru: 'ХОЗЯЕВА ТОЯ' }, ctx),
          fontFamily: 'DomainDisplay',
          fontSize: T.cap,
          fontWeight: 400,
          color: silver(ctx),
          textAlign: 'left',
          lineHeight: 1.4,
          letterSpacing: 3.4,
        },
        animate: { type: 'fade', duration: 2.4 },
      },
      {
        type: 'text',
        props: {
          x: 6,
          y: 418,
          w: 46,
          h: 'auto',
          text: t({ kz: 'Болмановтар әулеті', ru: 'Семья Болмановых' }, ctx),
          fontFamily: 'DomainDisplay',
          fontSize: T.lead,
          fontWeight: 400,
          color: ctx.theme.ink,
          textAlign: 'left',
          lineHeight: 1.25,
          letterSpacing: 0.4,
          placeholderKey: 'heroSubtitle',
          editableByEndUser: true,
          editableProperties: ['text'],
        },
        animate: { type: 'slideLeft', duration: 2.6 },
      },
      filigree(ctx, 516, 36, 0.6),
    ],
    height: 590,
  });
}

// ---------------------------------------------------------------------------
// 6. When — date, calendar, countdown
// ---------------------------------------------------------------------------

export function saukeleWhen(options: { targetIso: string }): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      // The one turning element on the page, and it sits behind the calendar
      // rather than beside it.
      medallion(ctx, 120, { x: 26, w: 48, rotation: 0, opacity: 0.12, spin: true }),
      head(ctx, { kz: 'Өтетін күні', ru: 'Дата торжества' }, 30),
      {
        type: 'calendar',
        props: {
          x: 12,
          y: 128,
          w: 76,
          // 350 measured in the browser: at less the sixth week row of a month
          // lands in the next section.
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
          y: 520,
          w: 84,
          h: 110,
          targetIso: options.targetIso,
          // `color` is the digits and `accentColor` the unit labels. They are
          // not called textColor/timeColor, which is what this recipe said
          // first — Zod dropped both and the timer rendered in the schema
          // default, wine #6b1d3a on a silver page.
          color: ctx.theme.ink,
          accentColor: silver(ctx),
          fontFamily: 'DomainDisplay',
          fontSize: 26,
        },
        animate: { type: 'fade', duration: 2.8 },
      },
    ],
    height: 680,
  });
}

// ---------------------------------------------------------------------------
// 7. Location
// ---------------------------------------------------------------------------

export function saukeleLocation(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Мекен-жайы', ru: 'Адрес' }, 34),
      body(
        ctx,
        { kz: 'Алматы, «Абиба» мейрамханасы', ru: 'Алматы, ресторан «Абиба»' },
        112,
        72,
        T.body,
      ),
      {
        type: 'map',
        props: {
          x: 10,
          y: 200,
          w: 80,
          // The whole card, not the map well: header, well and the 2GIS button.
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
    height: 560,
  });
}

// ---------------------------------------------------------------------------
// 8. RSVP
// ---------------------------------------------------------------------------

export function saukeleRsvp(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      panel(ctx, 20, 760),
      /*
       * The corner belongs to the panel, not to the page.
       *
       * `corner()` hangs its ornament 4% off the page edge, which is right for
       * a section that bleeds and wrong here: half the motif was cut by the
       * screen and the other half sat on the paper beside the plate, reading
       * as a leftover fragment rather than a corner. The panel runs 6..94, so
       * the ornament sits on its corner.
       */
      {
        type: 'image',
        props: {
          // Top-right of the plate: the hosts block two screens up is hung
          // left, so the ornament balances it, and the hero's own corner is on
          // the same side.
          x: 75,
          y: 27,
          w: 18,
          h: 70,
          rotation: 90,
          src: A.corner,
          alt: '',
          objectFit: 'contain',
          borderRadius: 0,
          tint: silver(ctx),
          opacity: 0.3,
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
          // 470 measured in the browser at 390 wide, with the phone field and
          // three stacked choices.
          h: 470,
          fontFamily: 'Monolog',
          // The section above carries the heading and the lead, so the widget
          // prints neither its own title nor its own subtitle.
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
    height: 820,
  });
}

// ---------------------------------------------------------------------------
// 9. Wishes
// ---------------------------------------------------------------------------

export function saukeleWishes(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      head(ctx, { kz: 'Ізгі тілектер', ru: 'Добрые пожелания' }, 24),
      {
        type: 'wishes',
        props: {
          x: 10,
          y: 110,
          w: 80,
          // 344 measured with one wish on the list.
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
    height: 500,
  });
}

// ---------------------------------------------------------------------------
// 10. Closing
// ---------------------------------------------------------------------------

export function saukeleClosing(): SectionBuilder {
  return (ctx): SectionResult => ({
    elements: [
      band(ctx, 20, 118, true),
      // Large and faint, with the closing line reading across it — the same
      // arrangement as the medallion behind the calendar, and the third place
      // on the page where type sits on an image rather than beside one.
      medallion(ctx, 150, { x: 22, w: 56, rotation: 200, opacity: 0.16 }),
      body(
        ctx,
        {
          kz: 'Тойымыздың қадірлі қонағы болыңыздар!',
          ru: 'Будьте дорогими гостями нашего тоя!',
        },
        230,
        70,
        T.body,
      ),
      corner(ctx, 300, { side: 'left', w: 26, opacity: 0.34, flipY: true }),
      corner(ctx, 300, { side: 'right', w: 26, opacity: 0.34, flipY: true }),
    ],
    height: 430,
  });
}
