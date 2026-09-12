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

  /**
   * A filmed envelope instead of a drawn one.
   *
   * Both reference services open on an envelope screen and both draw it in
   * CSS — as did ours, with a gradient flap and a gradient seal, while a
   * photographed wax seal sat unused in the repository. This is the frame that
   * gets screenshotted into the WhatsApp group, so it is worth a real one:
   * the guest taps, a short clip of an actual envelope opening plays once, and
   * the page is revealed when it ends.
   *
   * Optional in every part. With no `videoSrc` the gate falls back to the
   * drawn envelope, as it does under `prefers-reduced-motion` or when the
   * browser refuses to play.
   */
  envelope?: {
    /** Plays once on tap. */
    videoSrc?: string;
    /** First frame, shown immediately while the video loads. */
    posterSrc?: string;
    /**
     * CSS `object-position` for the clip, e.g. `'18% center'`.
     *
     * The gate is full bleed, so a 9:16 clip on a taller handset is cropped
     * left and right. A generated envelope is rarely dead centre in its own
     * frame — the first one measured out at x 30-610 of 720, which a centred
     * `cover` clips on the left — and this is what moves the window onto it.
     */
    focus?: string;
    /**
     * The colour of the button, and of anything else the gate paints.
     *
     * Explicit, because the alternative is guessing and guessing broke: the
     * gate read a colour off the first heading it could find, so the moment it
     * was pointed at the couple's own line — ivory, because it sits on a
     * photograph — the button became ivory on ivory and its label vanished.
     */
    accent?: string;
  };

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
  // Self-hosted, licensed by the owner and subset by scripts/subset-fonts.mjs.
  // These are not on Google Fonts and never will be; see kz-fonts.css.
  | 'Oranienbaum'
  | 'Copperplate'
  | 'Andantino'
  | 'Lavanderia'
  | 'DomainDisplay'
  | 'CeraBlack'
  | 'Monolog'
  | 'Corinthia'
  // Added 2026-09-07 — the faces the reference services actually set:
  // Shelley is the script on toi's flagship wedding card, Monumenta its
  // display serif, Romul the all-caps antiqua shaqyru24 sets its values in,
  // Ametist and GoodVibes the display faces on their best sellers. Kazakh
  // coverage checked by reading each file's cmap, not by trusting its name.
  | 'Shelley'
  | 'Monumenta'
  | 'Romul'
  | 'Ametist'
  | 'GoodVibes'
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
  /**
   * Set the line along a circular arc instead of a straight baseline.
   *
   * The device both reference services use for a repeated motto curving around
   * a round photograph — "wedding day · wedding day ·" following the frame.
   * A straight line of type is a caption; a curved one is part of the frame,
   * and it is the cheapest way to make a layout stop looking like a stack of
   * boxes.
   *
   * Rendered as SVG `<textPath>`, because CSS cannot set type on a curve.
   */
  curve?: {
    /** Degrees of arc the text spans. 360 wraps the full circle. */
    sweepDeg: number;
    /**
     * Run the type along the underside of the circle, where it reads upright
     * at the bottom of the frame rather than upside down.
     */
    flip?: boolean;
    /**
     * Radius as a percent of the element's half-width. Below 100 the type sits
     * inside the box, which is what leaves room for the glyphs to overhang.
     */
    radiusPct?: number;
  };
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
  /**
   * Repeat the artwork instead of fitting one copy to the box.
   *
   * For a printed border running the height of a page: one seamless tile,
   * repeated. Without it the only way to get a long band was to pre-render
   * the tile ten times into a second file — which is why
   * `oyu-band-x10.png` exists next to `oyu-band-tile.png`, and why it is
   * still the wrong length for any page that is not exactly ten tiles tall.
   */
  tile?: 'x' | 'y' | 'both';
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
   * A shaped bottom edge where the picture meets the page.
   *
   * A wave or an arc is honest geometry — it does not claim the screen is made
   * of anything. A torn-paper edge was tried and removed: rendered as a vector
   * it has no fibre, no thickness and no shadow from a curled edge, so it reads
   * as a jagged cut-out impersonating paper. Half-done skeuomorphism looks
   * worse than a straight line.
   *
   * Mutually exclusive with `maskShape` — a silhouette already decides every
   * edge the picture has.
   */
  edgeShape?: 'wave' | 'arc';
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
  /**
   * Whole-element transparency.
   *
   * Shapes and video backgrounds had this and images did not, so a template
   * asking for a photograph bleached back to a ground — the way the reference
   * cards run type over a picture — was silently ignored: the value never
   * reached the schema, and the picture rendered at full strength. 16 of the
   * 26 measured reference documents carry an opacity below 1 on a component,
   * most of them images.
   */
  opacity?: number;
  tint?: string;
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
  /**
   * Outline button — a transparent fill with a hairline rule around it.
   *
   * The generic «Открыть карту» builder has asked for one since it was
   * written, pairing `bgColor: 'transparent'` with a border the schema did not
   * have. Zod dropped it and the view hardcoded `border: 'none'`, so what
   * shipped was a label floating on the paper with nothing around it and no
   * indication it could be tapped.
   */
  borderColor?: string;
  borderWidth?: number;
  shadow?: { x: number; y: number; blur: number; color: string };
}

export type ShapeKind = 'rect' | 'circle' | 'line' | 'star' | 'arrow';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: ShapeKind;
  fill?: string;
  /**
   * Corner radius for `rect`, in px.
   *
   * A rounded panel holding the text is the load-bearing element of every
   * card in this market — the page is a flat colour and each section sits on
   * a lighter rounded surface inset from the edges. `rect` could only draw a
   * hard-cornered box, so templates here had no panels at all and read as a
   * stack of full-bleed strips.
   */
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  /**
   * Drop shadow, same shape as the one on image and text.
   *
   * «Інжу» asked for one on its greeting and RSVP panels from the day it was
   * written; the prop existed nowhere, Zod dropped it, and the panels have
   * been sitting flat on the paper ever since. A panel with no shadow does not
   * read as a surface above the page, which is the whole point of the device.
   */
  shadow?: { x: number; y: number; blur: number; color: string };
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
  /**
   * Ask for a phone number. Defaults to true only because every stored
   * document predates the flag; new templates set it false.
   *
   * The reference best-seller asks for nothing but the answer itself, and a
   * phone field is the commonest place a guest gives up — the host already
   * has the number, since that is how the link was sent.
   */
  askPhone?: boolean;
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
  markerTitle?: string;
  showStaticOnly?: boolean;
  buttonLabel?: string;
  accentColor?: string;
  /**
   * The block used to paint itself: white card, brown #2c1810 heading, beige
   * #f2ece9 well, #faf6f3 footer, Montserrat, and a red 📍. Every template got
   * the same one, so on the silver «Сәукеле» page the only warm brown and the
   * only red on the whole document were both inside the map. Defaults below
   * keep the old look for anything that does not pass these.
   */
  textColor?: string;
  bgColor?: string;
  fontFamily?: FontFamily;
}

export interface MusicPlayerElement extends BaseElement {
  type: 'music';
  audioSrc?: string;
  title?: string;
  autoPlayMuted?: boolean;
  accentColor: string;
  /**
   * How the control is drawn.
   *
   * `pill` is the original chrome. `dial` is a round play button with the
   * label set on a ring turning around it — the shape both reference services
   * float over their invitations, and the one that reads as part of the card
   * rather than as an app control bolted onto it.
   */
  variant?: 'pill' | 'dial';
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
  /**
   * Loop forever, or play once and hold the last frame.
   *
   * Defaults to looping, which is right for a texture running behind a
   * section and wrong for anything that resolves — a clip that resolves and
   * then snaps back to its first frame reads as a glitch.
   */
  loop?: boolean;
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
