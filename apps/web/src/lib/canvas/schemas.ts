/**
 * Zod schemas for canvas documents + elements. Used both for API validation
 * and as a single source of truth for defaults.
 */
import { z } from 'zod';

/**
 * Horizontal geometry is expressed in percent of the document width, but it
 * deliberately allows values outside 0-100 so an element can bleed past the
 * page edges.
 *
 * This is not a nicety — full-bleed decoration is the core visual device in
 * this whole product category. Both toi.com.kz and shaqyru24.kz place shapes
 * and ornaments roughly 560px wide on a ~375px canvas (≈150% width, starting
 * at ≈-25%), so the flourish runs off both sides and the page edge crops it.
 * Clamping x and w to 0-100, as this schema originally did, made that device
 * impossible to express and quietly flattened every template to letterboxed
 * blocks. `CanvasRenderer` already sets `overflow: hidden`, so the crop is
 * handled and no horizontal scrollbar can appear.
 */
const xPercent = z.number().min(-300).max(400);
const wPercent = z.number().gt(0).max(700);
const pxNumber = z.number().min(0).max(10000);
const rot = z.number().min(-360).max(360);

export const colorPattern = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|transparent|inherit)$/;
const safeColor = z.string().regex(colorPattern, 'invalid_color');

// ------- Sub-object schemas -------------------------------------------------

export const animationSchema = z.object({
  type: z.enum([
    'none', 'fade', 'fadeUp', 'fadeDown', 'zoomIn', 'slideLeft', 'slideRight', 'flip',
    'revealUp', 'letters', 'kenBurns', 'draw',
  ]),
  duration: z.number().min(0).max(10),
  delay: z.number().min(0).max(10),
  easing: z.enum(['ease', 'ease-in', 'ease-out', 'ease-in-out']),
  once: z.boolean().default(true),
});

/**
 * Looping motion. The floor of 3s is not arbitrary: anything faster reads as a
 * loading spinner rather than as decoration, and a turning ornament behind
 * text at 1s is genuinely unpleasant to read against.
 */
export const idleSchema = z.object({
  type: z.enum(['spin', 'float', 'sway', 'pulse']),
  duration: z.number().min(3).max(120),
});

export const responsiveSchema = z.object({
  preserveAspect: z.boolean().optional(),
  hideOnMobile: z.boolean().optional(),
  hideOnDesktop: z.boolean().optional(),
});

export const textShadowSchema = z.object({
  x: z.number().min(-50).max(50),
  y: z.number().min(-50).max(50),
  blur: z.number().min(0).max(50),
  color: safeColor,
});

export const shadowSchema = textShadowSchema;

const editablePropertySchema = z.enum([
  'text',
  'imageSrc',
  'color',
  'fontFamily',
  'fontSize',
  'bgColor',
  'borderColor',
  'link',
]);

export const placeholderKeySchema = z.enum([
  'coupleNames',
  'groomName',
  'brideName',
  'heroTitle',
  'heroSubtitle',
  'eventDate',
  'eventTime',
  'venueName',
  'venueAddress',
  'hashtag',
  'dressCode',
  'couplePhoto',
  'coverPhoto',
  'greetingText',
]);

// Kept in sync by hand with the FontFamily union in lib/canvas/types.ts —
// this was stuck at the original 5 fonts while the picker offered 24,
// silently 400ing any PATCH that saved one of the other 19 (Great Vibes,
// Playfair Display, Inter, PT Serif, ...). Found 2026-08-26 while building
// a template that used a non-original-5 font.
const fontFamilySchema = z.enum([
  'Oranienbaum', 'Monolog', 'Corinthia', 'Copperplate', 'Andantino', 'Lavanderia', 'DomainDisplay', 'CeraBlack',
  'Shelley', 'Monumenta', 'Romul', 'Ametist', 'GoodVibes',
  'Montserrat', 'Cormorant', 'Marck', 'Unbounded', 'system',
  'Playfair Display', 'Great Vibes', 'Lora', 'EB Garamond', 'Cormorant Garamond',
  'Prata', 'Forum', 'Tenor Sans', 'Manrope', 'Inter', 'Raleway', 'Nunito',
  'Comfortaa', 'Philosopher', 'Old Standard TT', 'PT Serif', 'Merriweather',
  'Yeseva One', 'Spectral', 'Alice', 'Vollkorn', 'Oswald', 'Pacifico', 'Bad Script',
]);

// ------- Base element -------------------------------------------------------

const baseElementSchema = z.object({
  id: z.string().min(1).max(64),
  x: xPercent,
  y: z.number().min(-1000).max(20000),
  w: wPercent,
  h: z.union([pxNumber, z.literal('auto')]),
  rotation: rot.default(0),
  zIndex: z.number().int().min(-1000).max(10000),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
  editableByEndUser: z.boolean().optional(),
  editableProperties: z.array(editablePropertySchema).optional(),
  placeholderKey: placeholderKeySchema.optional(),
  templateBindTo: z.string().optional(),
  pinned: z
    .object({
      corner: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
      offsetX: z.number().min(-200).max(2000).default(16),
      offsetY: z.number().min(-200).max(2000).default(16),
    })
    .optional(),
  parallax: z.number().min(0).max(0.6).optional(),
  animation: animationSchema.optional(),
  idle: idleSchema.optional(),
  mobile: z.record(z.string(), z.unknown()).optional(),
  responsive: responsiveSchema.optional(),
});

// ------- Element-specific props --------------------------------------------

const textPropsSchema = z.object({
  text: z.string().max(5000).default(''),
  fontFamily: fontFamilySchema.default('Montserrat'),
  fontSize: z.number().min(6).max(200).default(16),
  fontWeight: z
    .union([
      z.literal(100),
      z.literal(200),
      z.literal(300),
      z.literal(400),
      z.literal(500),
      z.literal(600),
      z.literal(700),
      z.literal(800),
      z.literal(900),
    ])
    .default(400),
  color: safeColor.default('#1a1a1a'),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  lineHeight: z.number().min(0.5).max(5).default(1.3),
  letterSpacing: z.number().min(-5).max(20).default(0),
  italic: z.boolean().default(false),
  uppercase: z.boolean().default(false),
  textShadow: textShadowSchema.optional(),
  curve: z
    .object({
      sweepDeg: z.number().min(1).max(360),
      flip: z.boolean().optional(),
      radiusPct: z.number().min(20).max(140).optional(),
    })
    .optional(),
});

const safeUrl = z
  .string()
  .max(2000)
  .refine(
    (v) => {
      // Reject javascript:/data:/vbscript: URLs and protocol-relative ones (XSS hardening)
      const trimmed = v.trim().toLowerCase();
      if (/^[a-z]+script:/i.test(trimmed)) return false;
      if (trimmed.startsWith('vbscript:')) return false;
      if (trimmed.startsWith('data:')) return false;
      if (trimmed.startsWith('about:')) return false;
      if (trimmed.startsWith('blob:')) return false;
      if (trimmed.startsWith('//')) return false;
      // Only allow relative paths starting with /, or http(s): URLs, or app custom schemes.
      if (trimmed.startsWith('/')) return true;
      return /^https?:\/\//i.test(trimmed);
    },
    { message: 'unsafe_url' }
  )
  .refine((v) => !v.includes('<') && !v.includes('>') && !v.includes('"') && !v.includes("'"), {
    message: 'unsafe_chars',
  });

// ------- Individual element schemas ----------------------------------------

const textElementSchema = baseElementSchema.merge(textPropsSchema).extend({
  type: z.literal('text'),
});

const headingElementSchema = baseElementSchema.merge(textPropsSchema).extend({
  type: z.literal('heading'),
  as: z.enum(['h1', 'h2', 'h3']).default('h1'),
});

const mediaSrc = z
  .string()
  .min(1)
  .max(2000)
  .refine(
    (v) => {
      const t = v.trim().toLowerCase();
      if (/^[a-z]+script:/i.test(t) || t.startsWith('vbscript:') || t.startsWith('data:') || t.startsWith('blob:') || t.startsWith('about:')) return false;
      if (t.startsWith('//')) return false;
      if (t.startsWith('/')) return true;
      return /^https?:\/\//i.test(t);
    },
    { message: 'unsafe_src' }
  );

const imageElementSchema = baseElementSchema.extend({
  type: z.literal('image'),
  src: mediaSrc,
  alt: z.string().max(200).optional(),
  objectFit: z.enum(['cover', 'contain', 'fill']).default('cover'),
  tile: z.enum(['x', 'y', 'both']).optional(),
  borderRadius: z.number().min(0).max(500).default(0),
  maskShape: z.enum(['rect', 'arch', 'circle', 'oval', 'oyu']).optional(),
  edgeShape: z.enum(['wave', 'arc']).optional(),
  maskFade: z
    .object({
      top: z.number().min(0).max(100).optional(),
      right: z.number().min(0).max(100).optional(),
      bottom: z.number().min(0).max(100).optional(),
      left: z.number().min(0).max(100).optional(),
    })
    .optional(),
  grade: z
    .object({
      saturate: z.number().min(0).max(300).optional(),
      brightness: z.number().min(0).max(300).optional(),
      contrast: z.number().min(0).max(300).optional(),
      sepia: z.number().min(0).max(100).optional(),
    })
    .optional(),
  borderWidth: z.number().min(0).max(20).optional(),
  borderColor: safeColor.optional(),
  shadow: shadowSchema.optional(),
  overlayColor: safeColor.optional(),
  overlayGradient: z
    .object({
      from: safeColor,
      to: safeColor,
      angle: z.number().min(0).max(360).default(180),
    })
    .optional(),
  opacity: z.number().min(0).max(1).optional(),
  tint: safeColor.optional(),
  linkHref: safeUrl.optional(),
});

const buttonActionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('rsvp') }),
  z.object({ kind: z.literal('map'), href: z.string().optional() }),
  z.object({ kind: z.literal('phone'), phone: z.string().optional() }),
  z.object({ kind: z.literal('link'), href: z.string() }),
  z.object({ kind: z.literal('whatsapp'), phone: z.string().optional(), text: z.string().optional() }),
  z.object({ kind: z.literal('calendar') }),
]);

const buttonElementSchema = baseElementSchema.extend({
  type: z.literal('button'),
  label: z.string().min(1).max(200),
  action: buttonActionSchema,
  bgColor: safeColor.default('#6b1d3a'),
  textColor: safeColor.default('#ffffff'),
  fontSize: z.number().min(8).max(60).default(18),
  fontFamily: fontFamilySchema.default('Montserrat'),
  fontWeight: textPropsSchema.shape.fontWeight.default(600),
  borderRadius: z.number().min(0).max(999).default(999),
  paddingX: z.number().min(0).max(200).optional(),
  paddingY: z.number().min(0).max(100).optional(),
  borderColor: safeColor.optional(),
  borderWidth: z.number().min(0).max(12).optional(),
  shadow: shadowSchema.optional(),
});

const shapeElementSchema = baseElementSchema.extend({
  type: z.literal('shape'),
  shape: z.enum(['rect', 'circle', 'line', 'star', 'arrow']).default('rect'),
  fill: safeColor.optional(),
  radius: z.number().min(0).max(500).optional(),
  stroke: safeColor.optional(),
  strokeWidth: z.number().min(0).max(50).optional(),
  opacity: z.number().min(0).max(1).optional(),
  shadow: shadowSchema.optional(),
});

const dividerElementSchema = baseElementSchema.extend({
  type: z.literal('divider'),
  color: safeColor.default('#c9a961'),
  thickness: z.number().min(1).max(20).default(2),
  style: z.enum(['solid', 'dashed', 'dotted', 'ornament']).default('solid'),
  ornamentId: z.string().optional(),
});

const coupleNamesElementSchema = baseElementSchema.extend({
  type: z.literal('couple-names'),
  first: z.string().min(0).max(100).default('Айбек'),
  second: z.string().min(0).max(100).default('Айдана'),
  connector: z.enum(['&', 'heart', 'ornament', 'және', 'и']).default('&'),
  font: fontFamilySchema.default('Cormorant'),
  fontSize: z.number().min(10).max(120).default(48),
  color: safeColor.default('#6b1d3a'),
  connectorColor: safeColor.optional(),
  italic: z.boolean().optional(),
  stacked: z.boolean().optional(),
});

const countdownElementSchema = baseElementSchema.extend({
  type: z.literal('countdown'),
  targetIso: z.string().optional(),
  timezone: z.string().default('Asia/Almaty'),
  fontFamily: fontFamilySchema.default('Cormorant'),
  fontSize: z.number().min(8).max(80).default(24),
  color: safeColor.default('#6b1d3a'),
  accentColor: safeColor.optional(),
  showLabels: z.boolean().default(true),
  labels: z
    .object({
      days: z.string().default('күн'),
      hours: z.string().default('сағ'),
      minutes: z.string().default('мин'),
      seconds: z.string().default('сек'),
    })
    .optional(),
});

const calendarElementSchema = baseElementSchema.extend({
  type: z.literal('calendar'),
  targetIso: z.string().optional(),
  timezone: z.string().default('Asia/Almaty'),
  fontFamily: fontFamilySchema.default('Cormorant'),
  fontSize: z.number().min(8).max(48).default(14),
  color: safeColor.default('#2c2117'),
  accentColor: safeColor.optional(),
  markStyle: z.enum(['ring', 'fill', 'heart']).default('ring'),
  showMonthTitle: z.boolean().default(true),
  showWeekdays: z.boolean().default(true),
  showAdjacentDays: z.boolean().default(false),
});

const rsvpFormElementSchema = baseElementSchema.extend({
  type: z.literal('rsvp-form'),
  title: z.string().optional(),
  fontFamily: fontFamilySchema.default('Montserrat'),
  bgColor: safeColor.default('#ffffff'),
  textColor: safeColor.default('#1a1a1a'),
  accentColor: safeColor.default('#6b1d3a'),
  askPlusOne: z.boolean().default(true),
  askPhone: z.boolean().default(true),
  askDietary: z.boolean().default(true),
  askChildren: z.boolean().default(true),
});

const wishesElementSchema = baseElementSchema.extend({
  type: z.literal('wishes'),
  title: z.string().optional(),
  fontFamily: fontFamilySchema.default('Montserrat'),
  bgColor: safeColor.default('#ffffff'),
  textColor: safeColor.default('#1a1a1a'),
  accentColor: safeColor.default('#6b1d3a'),
  reactions: z.array(z.string().emoji()).default(['❤️', '🙏', '🥂', '👏']),
  allowAnonymous: z.boolean().default(true),
});

export const programItemSchema = z.object({
  id: z.string().min(1),
  time: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
});

const programElementSchema = baseElementSchema.extend({
  type: z.literal('program'),
  title: z.string().optional(),
  items: z.array(programItemSchema).default([]),
  fontFamily: fontFamilySchema.default('Montserrat'),
  bgColor: safeColor.default('#ffffff'),
  textColor: safeColor.default('#1a1a1a'),
  accentColor: safeColor.default('#c9a961'),
  timeColor: safeColor.optional(),
});

const mapElementSchema = baseElementSchema.extend({
  type: z.literal('map'),
  address: z.string().max(200).optional(),
  markerTitle: z.string().optional(),
  // No lat/lng/zoom. The map view builds its embed from the 2GIS or Maps link
  // pasted into `address` and never read a coordinate or a zoom level, while
  // the inspector collected all three.
  showStaticOnly: z.boolean().default(false),
  buttonLabel: z.string().optional(),
  accentColor: safeColor.default('#6b1d3a'),
  textColor: safeColor.optional(),
  bgColor: safeColor.optional(),
  fontFamily: fontFamilySchema.optional(),
});

const musicElementSchema = baseElementSchema.extend({
  type: z.literal('music'),
  audioSrc: mediaSrc.optional(),
  title: z.string().optional(),
  autoPlayMuted: z.boolean().default(true),
  accentColor: safeColor.default('#6b1d3a'),
  /**
   * How the control is drawn. 'pill' is the existing chrome; 'dial' is a
   * circular play button with the label set on a ring around it, which is what
   * the reference services float over their invitations.
   */
  variant: z.enum(['pill', 'dial']).optional(),
  // No trackList. The player holds one `audioSrc` and there is no next-track
  // control anywhere in the product, so a saved playlist never played.
});

const giftElementSchema = baseElementSchema.extend({
  type: z.literal('gift'),
  kaspiPhone: z.string().max(30).optional(),
  kaspiCard: z.string().max(30).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  showDonors: z.boolean().default(true),
  accentColor: safeColor.default('#c9a961'),
});

const qrElementSchema = baseElementSchema.extend({
  type: z.literal('qr'),
  value: z.string().optional(),
  size: z.number().min(64).max(800).default(180),
  fgColor: safeColor.default('#1a1a1a'),
  bgColor: safeColor.default('#ffffff'),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  caption: z.string().optional(),
});

const lottieElementSchema = baseElementSchema.extend({
  type: z.literal('lottie'),
  src: mediaSrc,
  loop: z.boolean().default(true),
  autoplay: z.boolean().default(true),
  speed: z.number().min(0.1).max(5).default(1),
});

const videoBgElementSchema = baseElementSchema.extend({
  type: z.literal('video-bg'),
  src: mediaSrc,
  posterSrc: mediaSrc.optional(),
  overlayColor: safeColor.optional(),
  opacity: z.number().min(0).max(1).default(0.6),
  loop: z.boolean().optional(),
});

const ornamentElementSchema = baseElementSchema.extend({
  type: z.literal('ornament'),
  ornamentId: z.string().min(1),
  color: safeColor.optional(),
  flipX: z.boolean().default(false),
  flipY: z.boolean().default(false),
  src: z.string().optional(),
});

// ------- Discriminated union -----------------------------------------------

export const canvasElementSchema: z.ZodDiscriminatedUnion<
  'type',
  [
    typeof textElementSchema,
    typeof headingElementSchema,
    typeof imageElementSchema,
    typeof buttonElementSchema,
    typeof shapeElementSchema,
    typeof dividerElementSchema,
    typeof coupleNamesElementSchema,
    typeof countdownElementSchema,
    typeof calendarElementSchema,
    typeof rsvpFormElementSchema,
    typeof wishesElementSchema,
    typeof programElementSchema,
    typeof mapElementSchema,
    typeof musicElementSchema,
    typeof giftElementSchema,
    typeof qrElementSchema,
    typeof lottieElementSchema,
    typeof videoBgElementSchema,
    typeof ornamentElementSchema,
  ]
> = z.discriminatedUnion('type', [
  textElementSchema,
  headingElementSchema,
  imageElementSchema,
  buttonElementSchema,
  shapeElementSchema,
  dividerElementSchema,
  coupleNamesElementSchema,
  countdownElementSchema,
  calendarElementSchema,
  rsvpFormElementSchema,
  wishesElementSchema,
  programElementSchema,
  mapElementSchema,
  musicElementSchema,
  giftElementSchema,
  qrElementSchema,
  lottieElementSchema,
  videoBgElementSchema,
  ornamentElementSchema,
]);

export const backgroundSchema = z.object({
  type: z.enum(['solid', 'gradient', 'image', 'video']).default('solid'),
  color: safeColor.default('#fff8f1'),
  gradient: z
    .object({
      from: safeColor,
      to: safeColor,
      angle: z.number().min(0).max(360).default(180),
    })
    .optional(),
  imageSrc: z.string().optional(),
  videoSrc: z.string().optional(),
  overlayColor: safeColor.optional(),
  backgroundSize: z.enum(['cover', 'contain', 'repeat']).default('cover'),
});

const coreDocumentObject = z.object({
  version: z.literal(1).default(1),
  width: z.number().min(200).max(4000).default(390),
  height: z.number().min(100).max(20000).optional(),
  background: backgroundSchema,
  elements: z.array(canvasElementSchema).default([]),
  envelopeEnabled: z.boolean().optional(),
  // A filmed envelope opening, played once on tap. `mediaSrc` already
  // rejects data:/blob:/script: and accepts paths under /assets, so no new
  // validator is needed for the clip.
  envelope: z
    .object({
      videoSrc: mediaSrc.optional(),
      posterSrc: mediaSrc.optional(),
      focus: z.string().max(40).optional(),
      accent: safeColor.optional(),
    })
    .optional(),
  autoScroll: z
    .object({
      enabled: z.boolean(),
      speed: z.enum(['slow', 'normal', 'fast']).optional(),
    })
    .optional(),
  sectionOrder: z.array(z.string()).optional(),
  locale: z.enum(['kz', 'ru']).optional(),
  editorMetadata: z
    .object({
      baseTemplateId: z.string().optional(),
      lastModifiedAt: z.string().datetime().optional(),
      wizardCompletedAt: z.string().datetime().optional(),
    })
    .optional(),
});

// Mobile recursion: typed loosely to avoid circular-type TS errors;
// zod runtime still validates the full document recursively.
const lazyMobile: z.ZodType<unknown> = z.lazy(() =>
  (canvasDocumentSchema as z.ZodType<unknown>).nullish().transform((v: unknown) => v ?? undefined)
);

export const canvasDocumentSchema: z.ZodType<unknown> = coreDocumentObject.extend({
  mobile: lazyMobile.optional(),
});

export type CanvasDocumentInput = z.infer<typeof coreDocumentObject> & { mobile?: unknown };
export type CanvasDocumentOutput = z.infer<typeof coreDocumentObject> & { mobile?: unknown };

// Partial update schema (used by PATCH endpoint).
export const canvasDocumentPatchSchema = z
  .object({
    version: z.literal(1).optional(),
    width: z.number().min(200).max(4000).optional(),
    height: z.number().min(100).max(20000).optional(),
    background: backgroundSchema.optional(),
    elements: z.array(canvasElementSchema).optional(),
    mobile: z.unknown().optional(),
    envelopeEnabled: z.boolean().optional(),
    envelope: z
      .object({
        videoSrc: mediaSrc.optional(),
        posterSrc: mediaSrc.optional(),
        focus: z.string().max(40).optional(),
        accent: safeColor.optional(),
      })
      .optional(),
    autoScroll: z
      .object({
        enabled: z.boolean(),
        speed: z.enum(['slow', 'normal', 'fast']).optional(),
      })
      .optional(),
    sectionOrder: z.array(z.string()).optional(),
    locale: z.enum(['kz', 'ru']).optional(),
    editorMetadata: z
      .object({
        baseTemplateId: z.string().optional(),
        lastModifiedAt: z.string().datetime().optional(),
        wizardCompletedAt: z.string().datetime().optional(),
      })
      .optional(),
  })
  .passthrough();
