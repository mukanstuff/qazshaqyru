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
  | 'flip';

export type EasingType = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface AnimationConfig {
  type: AnimationType;
  duration: number; // seconds
  delay: number; // seconds
  easing: EasingType;
  once: boolean;
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

  // === Animation & responsive ===
  animation?: AnimationConfig;
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
  mobile?: InvitationCanvasDocument; // per-breakpoint override

  editorMetadata?: {
    baseTemplateId?: string;
    lastModifiedAt: string; // ISO
  };
}

// ----- Shared sub-types for element props -----------------------------------

export type FontFamily =
  | 'Montserrat'
  | 'Cormorant'
  | 'Marck'
  | 'Unbounded'
  | 'system';

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
  borderWidth?: number;
  borderColor?: string;
  shadow?: { x: number; y: number; blur: number; color: string };
  overlayColor?: string;
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
