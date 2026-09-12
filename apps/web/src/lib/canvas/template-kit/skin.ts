/**
 * A Skin is a template.
 *
 * Everything here is a choice about appearance. Nothing here decides what a
 * section says or where it comes in the running order — that is `skeleton.ts`,
 * and it is deliberately not a knob.
 *
 * The field list is drawn from what actually differs between the reference
 * cards, measured rather than imagined. Across toi's top twelve and
 * shaqyru24's twelve best sellers the variables are: two colours, a two-face
 * pairing, whether content floats on a panel, how the hero and gallery
 * photographs are cut, whether controls are pills or squared, and which single
 * object recurs in the corners. That vocabulary is enough for cards that look
 * nothing alike.
 *
 * Note what is NOT a knob: the type scale. Their sizes barely move between
 * cards (section headings 32-36, body 14-18) while everything else changes, so
 * letting a skin retune the scale is how a catalogue drifts.
 */
import type { FontFamily } from '../types';

export interface SkinPalette {
  /** The page. */
  page: string;
  /** The surface content sits on, when `surface` is `panel`. */
  panel: string;
  ink: string;
  muted: string;
  /** Headings, buttons, the marked calendar day. */
  accent: string;
  /** Hairlines, the ampersand, small ornament. */
  gold: string;
  /** Type over a photograph. */
  onPhoto: string;
  /**
   * Type set directly on the page ground.
   *
   * Not the same as `ink` once a skin uses panels: `kura-altyn` runs ivory
   * panels on a dark olive page, so `ink` is a near-black that is correct on
   * the panels and invisible everywhere else. The hero has no panel, and the
   * monogram composition sets the couple's names straight onto the ground —
   * which is how a whole opening screen came out unreadable.
   */
  onPage: string;
}

/**
 * Two faces. That is not a simplification — toi ships an entire card in
 * Montserrat plus one script, and the discipline is part of why it reads as
 * designed.
 */
export interface SkinFonts {
  /** Eyebrows, body copy, form controls, buttons. Nothing large. */
  sans: FontFamily;
  /** Section headings, the couple in the invite, the venue. */
  script: FontFamily;
  /** Figures: the date, the countdown, 15.05.2027. */
  display: FontFamily;
  /**
   * The couple in the hero and the hosts — a real black weight.
   *
   * Theirs are Montserrat 800. Setting a 400-weight face and asking the
   * browser for 800 is what made ours read as thin and characterless.
   */
  heavy: FontFamily;
}

/**
 * Decoration, as a set rather than one object.
 *
 * toi scatters 21 decorative pieces across the page in THREE colourways
 * (pink / blue / orange), TWO shapes (bloom and leaf) and THREE sizes
 * (54 / 88 / 122px), almost all of them hanging off an edge by 20-38px.
 * Ours stamped one file, one colour, one opacity, 27 times — same count,
 * none of the variety, which is why it read as wallpaper instead of
 * decoration.
 */
export interface SkinDecor {
  /** Two or three different cut-outs. */
  srcs: string[];
  /** Two or three tints applied across them. */
  tints: string[];
  /** Base width as a percent of the page; sizes vary around it. */
  size: number;
  /**
   * A wide, short ornament used as a rule under a heading.
   *
   * Separate from `srcs` because those are round cartouches: dropping one
   * into a 48%-wide, 26px-tall box makes `object-fit: contain` shrink it to a
   * 26px speck in the middle of the page, which is what the hosts block got.
   */
  rule?: string;
}

/**
 * The four ways the opening screen is composed.
 *
 * Every card in this catalogue opened the same way — a rectangular photograph
 * bled to both edges with the names centred over its foot — and that one
 * frame is the thing a host screenshots into the group chat. These are the
 * four arrangements the owner picked out of shaqyru24's best sellers:
 *
 *  - `wave`     the photograph is cut along a wave and the names sit on the
 *               page beneath it, not on the picture;
 *  - `oval`     a translucent ellipse over a full-bleed photograph, names
 *               inside it;
 *  - `corner`   the type driven into the bottom-right corner, ragged right,
 *               at three different indents;
 *  - `monogram` a column of photographs down the right-hand edge with the two
 *               initials set large beside them;
 *  - `letter`   the photograph ends on a PHOTOGRAPHED torn paper edge rather
 *               than on a drawn curve, and the page continues underneath it as
 *               paper. Ours, not theirs.
 */
export type HeroKind = 'wave' | 'oval' | 'corner' | 'monogram' | 'letter';

export interface HeroSpec {
  kind: HeroKind;
  /** Corner radius on the photographs, where the composition has any. */
  radius: number;
}

/**
 * The gallery band.
 *
 * `strip` is toi's row running off the right edge, `stagger` steps the three
 * frames down a diagonal, `duo` sets one tall frame against two small ones.
 * `mask` cuts the frames: an arch, a circle, an oval, or the қошқар мүйіз
 * cartouche the renderer carries as `oyu`.
 */
export interface GallerySpec {
  kind: 'strip' | 'stagger' | 'duo';
  radius: number;
  mask: 'none' | 'arch' | 'circle' | 'oval' | 'oyu';
}

/**
 * A photograph washed back until it is a ground rather than a picture.
 *
 * The device toi uses to keep a text section from being a rectangle of flat
 * colour: the whole section stands on a photograph with a paper veil over it
 * (`.painted-bg::after{background:rgba(250,245,236,.72)}`), and in their best
 * cards ALL SIX sections are built that way. Ours were flat cream, which is
 * why they read as empty however much was written on them.
 *
 * Ours differs in one deliberate way: the veil is a gradient, not a flat 72%.
 * A photograph that is strong at one edge and gone at the other gives the
 * block a direction; an even veil gives it a texture and nothing else.
 */
export interface SkinWash {
  /** One per text block, cycled if there are fewer. */
  srcs: string[];
  /** Veil colour at the strong edge, e.g. `rgba(246,240,229,0.62)`. */
  from: string;
  /** Veil colour at the quiet edge — usually near-opaque paper. */
  to: string;
  /** Desaturation applied to the photograph itself, 0-100. */
  saturate: number;
}

/**
 * The printed ornament band running down the edge of the page.
 *
 * A seamless tile repeated the full height of the document, with a finial at
 * each end. It is what makes the page read as one printed object instead of
 * as nine stacked boxes, and it is the reason content can sit off-centre
 * without looking like a mistake: it has something to sit against.
 */
export interface SkinBand {
  tile: string;
  capTop?: string;
  capBottom?: string;
  /** Width as a percent of the page. */
  width: number;
  /** Distance from the page edge to the band, percent. */
  inset: number;
  side: 'left' | 'right';
  tint: string;
}

/**
 * Photographs mounted like prints in an album.
 *
 * A white margin, a couple of degrees of rotation and a real photo-corner
 * asset. Every card in this market crops photographs to a rectangle, an arch
 * or a circle and stops there.
 */
export interface SkinPrint {
  /** White margin around the image, px. */
  border: number;
  borderColor: string;
  /** Photographed album mounting corner, cut out. */
  cornerSrc?: string;
}

export interface SkinAssets {
  /** The one hero photograph. */
  hero: string;
  /** Second and third frames — only the `monogram` composition uses them. */
  hero2?: string;
  hero3?: string;
  /** The three gallery photographs. */
  gallery1: string;
  gallery2: string;
  gallery3: string;
  closing: string;
  /** The page's own paper, tiled under everything. */
  paper?: string;
  /** A photographed torn paper edge, laid across a photograph's foot. */
  paperEdge?: string;
  /** Three details mounted as prints. */
  print1?: string;
  print2?: string;
  print3?: string;
  /** Five pictograms for the programme, in running order. */
  icons?: string[];
}

export interface Skin {
  slug: string;
  /**
   * Whether the catalogue shows it.
   *
   * A skin whose photography is still placeholder belongs in the code — so
   * the composition it exercises is not dead — but not in front of a
   * customer. Defaults to true.
   */
  active?: boolean;
  nameKz: string;
  nameRu: string;
  descriptionKz: string;
  descriptionRu: string;
  priceKzt: number;
  sortOrder: number;

  palette: SkinPalette;
  fonts: SkinFonts;

  /**
   * One multiplier over the whole type scale — toi's `--type-scale`.
   *
   * 1 reproduces the base table; their two extremes are 1.0 and 1.4. Below
   * about 1.15 the card reads small next to shaqyru24's, which sets body at
   * 18-22 and section headings at 32-36.
   */
  typeScale?: number;

  surface: 'flat' | 'panel';
  panelRadius: number;
  /** Side margin of the panel, percent of the page. */
  panelInset: number;
  panelBorder?: string;

  /** How the opening screen is composed. See `HeroKind`. */
  hero: HeroSpec;

  /** How the three gallery photographs are arranged and cut. */
  gallery: GallerySpec;

  /** Rounded buttons and inputs, or squared. */
  pill: boolean;

  /** Fill and hairline of the translucent detail cards. */
  cardFill: string;
  cardStroke: string;
  /** Wash at the foot of the hero photograph, and its coloured shadow. */
  heroWash: string;
  photoShadow: string;
  /** The outlined pill the hero date sits in. */
  datePillFill: string;
  datePillStroke: string;

  decor?: SkinDecor;
  /** Washed photographs behind the text blocks. */
  wash?: SkinWash;
  /** The printed ornament band down the page. */
  band?: SkinBand;
  /** How detail photographs are mounted. */
  print?: SkinPrint;
  assets: SkinAssets;

  /**
   * The opening screen. `true` draws the envelope; an object films it.
   */
  envelope: boolean | { videoSrc?: string; posterSrc?: string; focus?: string; accent?: string };

  /** The page scrolls itself until the guest touches it. toi does this. */
  autoScroll?: { enabled: boolean; speed?: 'slow' | 'normal' | 'fast' };
}
