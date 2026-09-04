/**
 * Template section library — shared vocabulary.
 *
 * A template is not hand-placed element by element. It is a *recipe*: an
 * ordered list of section builders, a theme, and an asset map. The composer
 * stacks the sections vertically and hands each one the y offset it starts at.
 *
 * Why this shape:
 *  - 30 templates × ~35 elements is ~1000 hand-placed coordinates. Placing
 *    those by hand guarantees drift; deriving them guarantees alignment.
 *  - Competitors reach 120 templates the same way — the skeleton of sections
 *    repeats and the theme (palette, type pair, photography) changes. A colour
 *    variant should cost a few lines, not a new layout pass.
 *  - Sections return *specs*, not finished elements, so the composer owns ids,
 *    z-order and absolute y. That keeps ids deterministic (stable diffs and
 *    tests) and makes reordering a section a one-line change.
 */
import type { AnimationConfig, CanvasElementType, FontFamily } from '../types';

/**
 * The three-tone palette plus type pair that gives a template its identity.
 *
 * Deliberately small. Competitor templates run on three colours — paper, ink,
 * accent — where "ink" is a warm dark tone rather than black; a fourth colour
 * is almost always a mistake rather than a feature.
 */
export interface TemplateTheme {
  /** Page background. */
  paper: string;
  /** Primary text. Warm and dark, not `#000`. */
  ink: string;
  /** Gold/ornament tone: rules, ring on the calendar, button fills. */
  accent: string;
  /** Secondary text — captions, weekday labels. */
  muted: string;
  /** Text drawn on top of photography. */
  onPhoto: string;

  /**
   * A single saturated tone for the one or two things that must not be gold.
   *
   * The three-colour rule above is right for paper, ink and metal, and a
   * fourth *decorative* colour is still a mistake. This is not decorative: in
   * this market the seal, the confirm button and the ornament medallion are
   * traditionally қызыл, and rendering them in the same gold as the hairlines
   * leaves a page with no focal point and no button that reads as a button.
   * Optional, so the existing cream themes are unaffected.
   */
  accentDeep?: string;

  /** Headings and ceremonial lines. */
  display: FontFamily;
  /** Running text. */
  body: FontFamily;
  /** Couple names. */
  script: FontFamily;
}

/** Asset slots a section may ask for. Missing keys degrade gracefully. */
export type AssetKey =
  | 'heroBg'
  | 'dressCodeBg'
  | 'closingBg'
  | 'ground'
  | 'divider'
  | 'ornamentTop'
  | 'ornamentBottom'
  | 'gallery1'
  | 'gallery2'
  | 'gallery3'
  | 'gallery4';

export type AssetMap = Partial<Record<AssetKey, string>>;

export interface SectionContext {
  theme: TemplateTheme;
  assets: AssetMap;
  locale: 'kz' | 'ru';
  /** Design width in px. Sections size things in percent of this. */
  width: number;
}

/**
 * One element as a section describes it: `y` is relative to the section's own
 * top edge, and the composer converts it to an absolute document coordinate.
 */
export interface ElementSpec {
  type: CanvasElementType;
  props: Record<string, unknown>;
  /**
   * Entrance behaviour.
   *
   * `false` opts out entirely — section backgrounds must not animate, since a
   * full-bleed painting sliding up into place reads as a page-load glitch and
   * drags the artwork away from the type meant to sit inside it.
   *
   * An object overrides the composer's default for this one element. That
   * default is a single `fadeUp` applied to everything, which is why every
   * shipped template animated all of its content in exactly one way, and why
   * "everything moves" still looked homemade. A section that wants its names to
   * arrive letter by letter over a photograph that is slowly pushing in has to
   * be able to say so.
   */
  animate?: false | Partial<AnimationConfig>;
}

export interface SectionResult {
  elements: ElementSpec[];
  /** Total vertical space the section occupies, including its own padding. */
  height: number;
}

export type SectionBuilder = (ctx: SectionContext) => SectionResult;

/** A section as it appears in a template recipe. */
export interface SectionEntry {
  /** Stable slug — also the prefix of every element id the section produces. */
  key: string;
  build: SectionBuilder;
}
