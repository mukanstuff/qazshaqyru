import type { FontFamily } from './constants';
import { FLAGSHIP_TEMPLATE_SLUGS } from './constants';

export type LayoutType =
  | 'fullbleed'
  | 'frame'
  | 'split'
  | 'editorial'
  | 'luxury-editorial'
  | 'dark-lux'
  | 'kazakh-scroll';

export type FlagshipTemplateSlug = (typeof FLAGSHIP_TEMPLATE_SLUGS)[number];

export type FlagshipCornerKey = 'tl' | 'tr' | 'bl' | 'br';

/** Per-flagship decoration tuning — distinct composition, not palette-swap. */
export interface FlagshipDecorProfile {
  coverOpacity?: number;
  cornerBlend?: 'multiply' | 'normal' | 'screen' | 'soft-light';
  cornerOpacity?: number;
  cornerScale?: number;
  hideCorners?: FlagshipCornerKey[];
  centerEmblem?: string;
  overlayGlow?: string;
  vignetteOpacity?: number;
  grainOpacity?: number;
  scrollRevealDirection?: 'up' | 'left' | 'right';
  heroKenBurns?: boolean;
  sectionStaggerMs?: number;
}

export type MotionProfile =
  | 'tpl-motion-rose'
  | 'tpl-motion-gold-frame'
  | 'tpl-motion-luxe'
  | 'tpl-motion-oriental'
  | 'tpl-motion-minimal'
  | 'tpl-motion-dramatic'
  | 'tpl-motion-ethno'
  | 'tpl-motion-scroll';

export interface TemplateConfig {
  /** URL-slug, also used as Invitation.templateKey */
  slug: string;

  /** Visual layout type */
  layout: LayoutType;

  /* ── Cover image (hero photo) ── */
  coverUrl: string;
  coverAlt: string;

  /* ── Palette ── */
  accent: string;        // hex, e.g. '#C9A96E'
  textLight: string;    // text on dark bg
  textDark: string;     // text on light bg
  bgSection: string;    // Tailwind bg-xxx class for mid-page sections
  bgAlt: string;         // alternate section bg

  /* ── Font for headings / names ── */
  headingFont: FontFamily;

  /* ── Default CSS for hero gradient overlay (fallback when no real bg) ── */
  overlayGradient: string;

  /* ── Asset filenames relative to /public/assets/templates/{slug}/ ── */
  assets: {
    /** Background texture (silk, marble, paper) */
    bgTexture?: string;
    /** Hero photo (same as coverUrl usually) */
    bgCover?: string;
    /** Top-left corner flowers */
    flowerTl?: string;
    /** Top-right corner flowers */
    flowerTr?: string;
    /** Bottom-left corner flowers */
    flowerBl?: string;
    /** Bottom-right corner flowers */
    flowerBr?: string;
    /** Horizontal ornament divider */
    divider?: string;
    /** Thin line divider */
    dividerThin?: string;
    /** Inner decorative frame (for 'frame' layout) */
    frameInner?: string;
    /** Film grain overlay (multiply blend) */
    overlayGrain?: string;
    /** Edge vignette overlay */
    overlayVignette?: string;
  };

  /* ── Layout-specific overrides ── */
  /** For 'split': fraction of screen for photo side (0–1). Default 0.5 */
  splitPhotoFraction?: number;
  /** For 'split': which side has the photo. Default 'left' */
  splitPhotoSide?: 'left' | 'right';

  /** Default background music when invitation.musicUrl is unset */
  defaultMusicUrl?: string;

  /** Root layout motion profile (invitation pages only) */
  animationClass?: MotionProfile;
}
