/**
 * QazShaqyru Canvas Document — strict type definitions for the new
 * WYSIWYG invitation engine.
 *
 * Coordinate system:
 *  - `x`, `w` are in percent of document width (0-100) for reliable mobile
 *    scaling. `y` and `h` are in pixels from the top of the document (pages
 *    scroll vertically; absolute y is what designers expect).
 *  - Default design width is 390 (mobile-first). For desktop previews the
 *    editor uses a different `width` but stores the *same* percent-based x/w.
 */

export const CANVAS_VERSION = 1 as const;
export const DEFAULT_MOBILE_WIDTH = 390;
export const DEFAULT_DESKTOP_WIDTH = 1200;
export const BRAND_PRIMARY = '#6b1d3a';
export const BRAND_ACCENT = '#c9a961';

export type CanvasElement =
  | TextElement
  | HeadingElement
  | ImageElement
  | ButtonElement
  | ShapeElement
  | DividerElement
  | CoupleNamesElement
  | CountdownElement
  | CalendarElement
  | RsvpFormElement
  | WishesElement
  | ProgramElement
  | MapElement
  | MusicPlayerElement
  | GiftBlockElement
  | QrCodeElement
  | LottieElement
  | VideoBgElement
  | OrnamentElement;

export type CanvasElementType = CanvasElement['type'];

export type EditableProperty =
  | 'text'
  | 'imageSrc'
  | 'color'
  | 'fontFamily'
  | 'fontSize'
  | 'bgColor'
  | 'borderColor'
  | 'link';

export type AnimationType =
  | 'none'
  | 'fade'
  | 'fadeUp'
  | 'fadeDown'
  | 'zoomIn'
  | 'slideLeft'
  | 'slideRight'
  | 'flip'
  /**
   * The four below exist because "everything animates" and "the motion is
   * designed" are different things. Every element in every shipped template
   * used the same `fadeUp`, which is why the result read as homemade however
   * many elements carried it.
   */
  /** Wipes into view behind a moving edge instead of translating. */
  | 'revealUp'
  /** Letters arrive one by one — for the couple's names, and nothing else. */
  | 'letters'
  /** Slow scale on a photograph, so a still frame is not still. */
  | 'kenBurns'
  /** Line art draws itself along its own stroke. SVG only. */
  | 'draw';

export type EasingType = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface AnimationConfig {
  type: AnimationType;
  duration: number; // seconds
  delay: number; // seconds
  easing: EasingType;
  once: boolean;
}

/**
 * Looping motion vocabulary.
 *
 * Deliberately four, and deliberately quiet. The reference set also carries
 * `shake`, `wobble` and `bounceIn`, which on a wedding invitation read as a
 * banner ad; the four kept here are the ones that can run forever behind text
 * without becoming the thing you look at.
 */
export type IdleMotionType = 'spin' | 'float' | 'sway' | 'pulse';

export interface IdleMotionConfig {
  type: IdleMotionType;
  /** One full cycle, in seconds. Slow is the point: 20-60s for `spin`. */
  duration: number;
}

export interface ResponsiveConfig {
  preserveAspect?: boolean;
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}

/**
 * Common fields shared by every canvas element.
 */
export interface BaseElement {
  id: string;
  type: CanvasElementType;
  x: number; // percent of width 0-100
  y: number; // px from top
  w: number; // percent of width
  h: number | 'auto';
  rotation: number; // degrees
  zIndex: number;
  locked: boolean;
  hidden: boolean;

  // === Template-builder metadata (see p.2.8 of spec) ===
  editableByEndUser?: boolean;
  editableProperties?: EditableProperty[];
  placeholderKey?: PlaceholderKey;
  templateBindTo?: string;

  /**
   * Pin the element to the viewport instead of scrolling with the page —
   * how competitors float the music toggle and the "write a wish" button
   * (their `audio-fixed` / `fixed-wishes` component types).
   *
   * Modelled as a flag rather than an element type so any element can be
   * pinned: `y` keeps its authored value for the editor canvas, while the
   * guest page positions the element from the named viewport corner.
   */
  pinned?: {
    corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    offsetX: number; // px from that corner
    offsetY: number;
  };

  /**
   * Scroll parallax: how much slower than the page this element moves, as a
   * fraction of scroll distance. 0.2 lifts a background off the text in front
   * of it; above ~0.4 the illusion breaks and it reads as a bug. Absent or 0
   * means the element scrolls with the page.
   */
  parallax?: number;

  // === Animation & responsive ===
  animation?: AnimationConfig;

  /**
   * Continuous, looping motion — an ornament that turns forever, a seal that
   * breathes, a sprig that sways.
   *
   * Separate from `animation` because the two are different things that were
   * being confused: `animation` is an *entrance*, plays once when the element
   * scrolls into view, and then the element is finished. Reading the two
   * reference services' stylesheets, both ship an entrance set AND a looping
   * set (`spin`, `pulse`, `float`, `swayLR`, `heartbeat`), and the looping one
   * is most of why their pages read as alive rather than as a static poster
   * that faded in. This engine had only entrances, so every template went
   * completely still the moment it finished loading.
   *
   * It also cannot share a node with `animation`: both compile to the CSS
   * `animation` shorthand, and the second declaration replaces the first. The
   * renderer therefore puts idle motion on its own nested layer inside the
   * element wrapper — which is exactly how the reference implementation does
   * it (their `animation-layer` div sits inside the component's content box).
   */
  idle?: IdleMotionConfig;
  /**
   * Mobile override — the ONLY responsive mechanism for element position/size.
   * (A second, competing full-document `InvitationCanvasDocument.mobile` field
   * used to exist alongside this one; it was unused in practice and removed —
   * don't reintroduce a document-level override, extend this instead.)
   */
  mobile?: Partial<BaseElement>;
  responsive?: ResponsiveConfig;
}

/**
 * Placeholder keys identify slots the wizard auto-fills
 * (e.g. `groomName`, `eventDate`).
 */
export type PlaceholderKey =
  | 'coupleNames'
  | 'groomName'
  | 'brideName'
  | 'heroTitle'
  | 'heroSubtitle'
  | 'eventDate'
  | 'eventTime'
  | 'venueName'
  | 'venueAddress'
  | 'hashtag'
  | 'dressCode'
  | 'couplePhoto'
  | 'coverPhoto'
  | 'greetingText';

export interface CanvasBackground {
  type: 'solid' | 'gradient' | 'image' | 'video';
  color?: string;
  gradient?: { from: string; to: string; angle?: number };
  imageSrc?: string;
  videoSrc?: string;
  overlayColor?: string; // subtle dark/light overlay
  backgroundSize?: 'cover' | 'contain' | 'repeat';
}

/**
 * Top-level document.
 */
export interface InvitationCanvasDocument {
  version: typeof CANVAS_VERSION;
  width: number;
  height?: number; // undefined = auto (scroll-page), fixed = one-pager
  background: CanvasBackground;
  elements: CanvasElement[];

  /** When true, the guest sees a "tap to open" envelope screen before the
   *  invitation itself renders. Purely presentational — has no effect in
   *  editor mode (the host always sees the invitation directly). */
  envelopeEnabled?: boolean;

  /** Guest page auto-scrolls slowly on its own instead of requiring the
   *  guest to scroll manually. Cancelled permanently the moment the guest
   *  scrolls/touches themselves, and skipped entirely under
   *  prefers-reduced-motion. No effect in editor mode. */
  autoScroll?: { enabled: boolean; speed?: 'slow' | 'normal' | 'fast' };

  /** Explicit vertical order of the "Sections" tab's built-in section ids
   *  (see ElementSettingsConfig.ts EDITOR_SECTION_DEFS). When set, the
   *  Sections tab lists sections in this order AND the elements belonging
   *  to each section have been vertically repositioned (via
   *  lib/canvas/section-reorder.ts) to render in this order on the canvas.
   *  Absent = default built-in order, nothing repositioned. */
  sectionOrder?: string[];

  /**
   * Language of the invitation's own content, which drives every label the
   * renderer supplies rather than the host types: RSVP buttons, countdown
   * units, calendar month and weekday names.
   *
   * It lives on the document, not on the Invitation row, because it is a
   * property of the composed design — templates are authored in a language,
   * and the labels have to agree with the words already on the canvas. Before
   * this existed the renderer defaulted to `ru` unconditionally, so a fully
   * Kazakh invitation still showed "ПН ВТ СР" in its calendar and Russian
   * RSVP buttons. Absent = `ru`, preserving the old behaviour for documents
   * written before this field.
   */
  locale?: 'kz' | 'ru';

  editorMetadata?: {
    baseTemplateId?: string;
    lastModifiedAt: string; // ISO
    /** Set once the quick-fill wizard has been applied or explicitly
     *  skipped for this invitation, so it doesn't auto-open again. */
    wizardCompletedAt?: string; // ISO
  };
}

// ----- Shared sub-types for element props -----------------------------------

// Every option here MUST have a verified Cyrillic-script glyph subset — this
// product is a Kazakhstan-market invitation service, so real text is almost
// always Kazakh/Russian Cyrillic. A Latin-only decorative font (e.g. the
// Google Fonts "Great Vibes" webfont before this check, or Dancing Script,
// Cinzel, Poppins, DM Serif Display, ...) silently falls back to the
// generic system font for Cyrillic text with no error — the picker looked
// fine, the guest page just quietly rendered the wrong font. Verified via
// the Google Fonts css2 API (checked for a `/* cyrillic */` unicode-range
// block, not guessed) on 2026-08-26; re-verify before adding any new entry.
export type FontFamily =
  // 5 original
  | 'Montserrat'
  | 'Cormorant'
  | 'Marck'
  | 'Unbounded'
  | 'system'
  // Verified Cyrillic-capable Google Fonts
  | 'Playfair Display'
  | 'Great Vibes'
  | 'Lora'
  | 'EB Garamond'
  | 'Cormorant Garamond'
  | 'Prata'
  | 'Forum'
  | 'Tenor Sans'
  | 'Manrope'
  | 'Inter'
  | 'Raleway'
  | 'Nunito'
  | 'Comfortaa'
  | 'Philosopher'
  | 'Old Standard TT'
  | 'PT Serif'
  | 'Merriweather'
  | 'Yeseva One'
  | 'Spectral'
  | 'Alice'
  | 'Vollkorn'
  | 'Oswald'
  | 'Pacifico'
  /**
   * The only calligraphic face available that can actually write Kazakh.
   *
   * Verified by measuring glyph advance widths against the loaded webfont
   * (the method this repo already uses — see KAZAKH_SUBSTITUTE): Great Vibes
   * carries not one of Ә Ғ Қ Ң Ө Ұ Ү Һ І, so it is substituted away; Pacifico
   * and Caveat do carry all nine but are a casual brush and a marker hand
   * respectively, neither of which reads as a wedding invitation. Both
   * reference services set couple names in flowing calligraphy, and this is
   * the closest the free, Kazakh-capable set gets to it.
   */
  | 'Bad Script';

export interface TextProps {
  text: string;
  fontFamily: FontFamily;
  fontSize: number; // px at design width
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number; // px
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  textShadow?: { x: number; y: number; blur: number; color: string };
}

// ----- Concrete element types ----------------------------------------------

export interface TextElement extends BaseElement, TextProps {
  type: 'text';
}

export interface HeadingElement extends BaseElement, TextProps {
  type: 'heading';
  as?: 'h1' | 'h2' | 'h3';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
  objectFit: 'cover' | 'contain' | 'fill';
  borderRadius: number;
  /**
   * Silhouette the photo is cut into.
   *
   * `arch` — round head, straight sides, flat foot — is the shape that turns
   * a rectangular photograph into part of the card rather than a picture
   * pasted onto it, and it is the single most recognisable device in this
   * template category. A plain `borderRadius` cannot express it: an arch
   * needs a large radius on the top corners and none on the bottom.
   */
  maskShape?: 'rect' | 'arch' | 'circle' | 'oval' | 'oyu';
  /**
   * Feather the picture's own edges into the page, in percent of its width or
   * height per side.
   *
   * Without this an illustration is a rectangle, and a rectangle whose cream
   * differs by two percent from the page's cream is a visible seam across the
   * invitation — which is exactly what shipped. Implemented as a mask, so the
   * fade is transparency rather than a colour painted on top, and it works
   * over any background.
   */
  maskFade?: { top?: number; right?: number; bottom?: number; left?: number };
  /**
   * Photographic grading, so a stock photo can be pulled into the template's
   * palette instead of fighting it. Percentages relative to the original.
   */
  grade?: { saturate?: number; brightness?: number; contrast?: number; sepia?: number };
  borderWidth?: number;
  borderColor?: string;
  shadow?: { x: number; y: number; blur: number; color: string };
  overlayColor?: string;
  /**
   * A gradient scrim painted over the photograph.
   *
   * Not decoration — legibility. White type over a photograph is the standard
   * hero composition in this category, and it fails completely the moment the
   * picture is bright: a wedding photograph is mostly white dress under warm
   * light, so the names vanish into it. A text shadow does not fix this; it
   * only outlines letters that still have no contrast behind them. Both
   * reference services darken the photograph under the type instead, and this
   * is that. Use `transparent` at the clear end so the top of the picture is
   * untouched.
   */
  overlayGradient?: { from: string; to: string; angle?: number };
  /**
   * Recolour the image's opaque pixels to a flat colour, keeping its alpha.
   *
   * For ornament artwork specifically. Generated ornaments arrive as black
   * line art keyed to transparency, and a black PNG is only ever correct on
   * one background — the moment the theme changes it is wrong, which is how
   * hardcoded ornament colour got baked into templates here before. With a
   * tint the same file is the theme's gold on ivory, white over a photograph
   * and crimson on a seal, so one asset serves every palette.
   *
   * Implemented as `mask-image` plus a background colour rather than a
   * `filter`, because filters cannot reach an arbitrary hue from black.
   */
  tint?: string;
  linkHref?: string;
}

export type ButtonAction =
  | { kind: 'rsvp' }
  | { kind: 'map'; href?: string }
  | { kind: 'phone'; phone?: string }
  | { kind: 'link'; href: string }
  | { kind: 'whatsapp'; phone?: string; text?: string }
  | { kind: 'calendar' };

export interface ButtonElement extends BaseElement {
  type: 'button';
  label: string;
  action: ButtonAction;
  bgColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: FontFamily;
  fontWeight: TextProps['fontWeight'];
  borderRadius: number;
  paddingX?: number;
  paddingY?: number;
  shadow?: { x: number; y: number; blur: number; color: string };
}

export type ShapeKind = 'rect' | 'circle' | 'line' | 'star' | 'arrow';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeKind;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface DividerElement extends BaseElement {
  type: 'divider';
  color: string;
  thickness: number;
  style: 'solid' | 'dashed' | 'dotted' | 'ornament';
  ornamentId?: string;
}

export interface CoupleNamesElement extends BaseElement {
  type: 'couple-names';
  first: string;
  second: string;
  connector: '&' | 'heart' | 'ornament' | 'және' | 'и';
  font: FontFamily;
  fontSize: number;
  color: string;
  connectorColor?: string;
  /**
   * Italic, and `stacked` to force one name per line.
   *
   * Both exist because the couple's names are the focal point of every
   * invitation and previously had neither: without italic a template wanting
   * an elegant italic serif had to abandon `couple-names` for plain text
   * elements and lose the wizard binding, and without stacking the pair
   * silently ran onto one line and overflowed a framed layout.
   */
  italic?: boolean;
  stacked?: boolean;
}

/**
 * A month grid with the event day marked — the "календарь" block that appears
 * in essentially every Kazakh invitation template (both toi.com.kz and
 * shaqyru24.kz ship one). Distinct from `ProgramElement`, which is the
 * hour-by-hour running order of the evening, not a month view.
 *
 * The grid is derived from `targetIso`, never stored, so it cannot drift out
 * of sync with the event date the rest of the invitation shows. Weeks start
 * on Monday, which is the convention in KZ/RU.
 */
export interface CalendarElement extends BaseElement {
  type: 'calendar';
  targetIso?: string; // falls back to the invitation's event date
  timezone?: string;
  fontFamily: FontFamily;
  fontSize: number;
  color: string;
  /** Ring/fill colour drawn around the event day. */
  accentColor?: string;
  /** How the event day is emphasised. */
  markStyle?: 'ring' | 'fill' | 'heart';
  showMonthTitle?: boolean;
  showWeekdays?: boolean;
  /** Dim days outside the event month instead of leaving blanks. */
  showAdjacentDays?: boolean;
}

export interface CountdownElement extends BaseElement {
  type: 'countdown';
  targetIso?: string; // e.g. invitation.eventDate
  timezone?: string; // e.g. "Asia/Almaty"
  fontFamily: FontFamily;
  fontSize: number;
  color: string;
  accentColor?: string;
  showLabels?: boolean;
  labels?: { days: string; hours: string; minutes: string; seconds: string };
}

export interface RsvpFormElement extends BaseElement {
  type: 'rsvp-form';
  title?: string;
  fontFamily: FontFamily;
  bgColor: string;
  textColor: string;
  accentColor: string;
  askPlusOne: boolean;
  askDietary: boolean;
  askChildren: boolean;
  /** Alternate RSVP channel: shows a "Reply via WhatsApp" button opening a
   *  chat with this number, alongside the in-app form. Digits only (host
   *  enters it E.164-ish; the guest view strips non-digits for wa.me). */
  whatsappPhone?: string;
}

export interface WishesElement extends BaseElement {
  type: 'wishes';
  title?: string;
  fontFamily: FontFamily;
  bgColor: string;
  textColor: string;
  accentColor: string;
  reactions: string[]; // emoji list
  allowAnonymous: boolean;
}

export interface ProgramItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface ProgramElement extends BaseElement {
  type: 'program';
  title?: string;
  items: ProgramItem[];
  fontFamily: FontFamily;
  bgColor: string;
  textColor: string;
  accentColor: string;
  timeColor?: string;
}

export interface MapElement extends BaseElement {
  type: 'map';
  address?: string;
  lat?: number;
  lng?: number;
  markerTitle?: string;
  zoom?: number;
  showStaticOnly?: boolean;
  buttonLabel?: string;
  accentColor?: string;
}

export interface MusicPlayerElement extends BaseElement {
  type: 'music';
  audioSrc?: string;
  title?: string;
  autoPlayMuted?: boolean;
  accentColor: string;
  trackList?: { id: string; title: string; src: string }[];
}

export interface GiftBlockElement extends BaseElement {
  type: 'gift';
  kaspiPhone?: string;
  kaspiCard?: string;
  title?: string;
  subtitle?: string;
  showDonors: boolean;
  accentColor: string;
}

export interface QrCodeElement extends BaseElement {
  type: 'qr';
  value?: string; // defaults to invitation URL
  size: number;
  fgColor: string;
  bgColor: string;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  caption?: string;
}

export interface LottieElement extends BaseElement {
  type: 'lottie';
  src: string;
  loop: boolean;
  autoplay: boolean;
  speed: number;
}

export interface VideoBgElement extends BaseElement {
  type: 'video-bg';
  src: string;
  posterSrc?: string;
  overlayColor?: string;
  opacity?: number;
}

export interface OrnamentElement extends BaseElement {
  type: 'ornament';
  ornamentId: string;
  color?: string;
  flipX?: boolean;
  flipY?: boolean;
  src?: string;
}

// ----- Helpers --------------------------------------------------------------

export const FUNCTIONAL_ELEMENT_TYPES: CanvasElementType[] = [
  'countdown',
  'couple-names',
  'rsvp-form',
  'wishes',
  'program',
  'map',
  'music',
  'gift',
  'qr',
  'lottie',
  'video-bg',
];

export const TEXT_ELEMENT_TYPES: CanvasElementType[] = ['text', 'heading'];

export function isFunctionalElement(el: Pick<CanvasElement, 'type'>): boolean {
  return FUNCTIONAL_ELEMENT_TYPES.includes(el.type);
}

export function isTextElement(el: Pick<CanvasElement, 'type'>): el is TextElement | HeadingElement {
  return TEXT_ELEMENT_TYPES.includes(el.type);
}

export function elementDefaultSize(type: CanvasElementType): { w: number; h: number | 'auto' } {
  switch (type) {
    case 'heading':
      return { w: 80, h: 'auto' };
    case 'text':
      return { w: 80, h: 'auto' };
    case 'image':
      return { w: 70, h: 280 };
    case 'button':
      return { w: 60, h: 56 };
    case 'shape':
      return { w: 20, h: 20 };
    case 'divider':
      return { w: 80, h: 2 };
    case 'couple-names':
      return { w: 90, h: 'auto' };
    case 'countdown':
      return { w: 90, h: 'auto' };
    case 'rsvp-form':
    case 'wishes':
    case 'program':
      return { w: 90, h: 'auto' };
    case 'map':
      return { w: 90, h: 220 };
    case 'music':
      return { w: 70, h: 64 };
    case 'gift':
      return { w: 80, h: 'auto' };
    case 'qr':
      return { w: 35, h: 'auto' };
    case 'lottie':
      return { w: 40, h: 40 };
    case 'video-bg':
      return { w: 100, h: 'auto' };
    case 'ornament':
      return { w: 30, h: 'auto' };
    default:
      return { w: 50, h: 'auto' };
  }
}
