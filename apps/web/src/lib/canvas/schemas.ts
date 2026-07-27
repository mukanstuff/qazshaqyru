/**
 * Zod schemas for canvas documents + elements. Used both for API validation
 * and as a single source of truth for defaults.
 */
import { z } from 'zod';

const percent = z.number().min(0).max(100);
const pxNumber = z.number().min(0).max(10000);
const rot = z.number().min(-360).max(360);

export const colorPattern = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|transparent|inherit)$/;
const safeColor = z.string().regex(colorPattern, 'invalid_color');

// ------- Sub-object schemas -------------------------------------------------

export const animationSchema = z.object({
  type: z.enum(['none', 'fade', 'fadeUp', 'fadeDown', 'zoomIn', 'slideLeft', 'slideRight', 'flip']),
  duration: z.number().min(0).max(10),
  delay: z.number().min(0).max(10),
  easing: z.enum(['ease', 'ease-in', 'ease-out', 'ease-in-out']),
  once: z.boolean().default(true),
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

const fontFamilySchema = z.enum(['Montserrat', 'Cormorant', 'Marck', 'Unbounded', 'system']);

// ------- Base element -------------------------------------------------------

const baseElementSchema = z.object({
  id: z.string().min(1).max(64),
  x: percent,
  y: z.number().min(-1000).max(20000),
  w: percent,
  h: z.union([pxNumber, z.literal('auto')]),
  rotation: rot.default(0),
  zIndex: z.number().int().min(-1000).max(10000),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
  editableByEndUser: z.boolean().optional(),
  editableProperties: z.array(editablePropertySchema).optional(),
  placeholderKey: placeholderKeySchema.optional(),
  templateBindTo: z.string().optional(),
  animation: animationSchema.optional(),
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
  borderRadius: z.number().min(0).max(500).default(0),
  borderWidth: z.number().min(0).max(20).optional(),
  borderColor: safeColor.optional(),
  shadow: shadowSchema.optional(),
  overlayColor: safeColor.optional(),
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
  shadow: shadowSchema.optional(),
});

const shapeElementSchema = baseElementSchema.extend({
  type: z.literal('shape'),
  shape: z.enum(['rect', 'circle', 'line', 'star', 'arrow']).default('rect'),
  fill: safeColor.optional(),
  stroke: safeColor.optional(),
  strokeWidth: z.number().min(0).max(50).optional(),
  opacity: z.number().min(0).max(1).optional(),
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
});

const countdownElementSchema = baseElementSchema.extend({
  type: z.literal('countdown'),
  targetIso: z.string().optional(),
  timezone: z.string().default('Asia/Almaty'),
  fontFamily: fontFamilySchema.default('Unbounded'),
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

const rsvpFormElementSchema = baseElementSchema.extend({
  type: z.literal('rsvp-form'),
  title: z.string().optional(),
  fontFamily: fontFamilySchema.default('Montserrat'),
  bgColor: safeColor.default('#ffffff'),
  textColor: safeColor.default('#1a1a1a'),
  accentColor: safeColor.default('#6b1d3a'),
  askPlusOne: z.boolean().default(true),
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
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  markerTitle: z.string().optional(),
  zoom: z.number().min(1).max(20).default(14),
  showStaticOnly: z.boolean().default(false),
  buttonLabel: z.string().optional(),
});

const musicElementSchema = baseElementSchema.extend({
  type: z.literal('music'),
  audioSrc: mediaSrc.optional(),
  title: z.string().optional(),
  autoPlayMuted: z.boolean().default(true),
  accentColor: safeColor.default('#6b1d3a'),
  trackList: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        src: z.string(),
      })
    )
    .optional(),
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
  editorMetadata: z
    .object({
      baseTemplateId: z.string().optional(),
      lastModifiedAt: z.string().datetime().optional(),
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
    editorMetadata: z
      .object({
        baseTemplateId: z.string().optional(),
        lastModifiedAt: z.string().datetime().optional(),
      })
      .optional(),
  })
  .passthrough();
