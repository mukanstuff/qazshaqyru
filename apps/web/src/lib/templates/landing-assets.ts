/**
 * Landing page image paths under public/assets/landing/.
 * HF manifest outputs .png (+ optional .webp for hero/banner).
 * SVG placeholders used until generation completes.
 */

const LANDING_BASE = '/assets/landing';

/** Resolve best available asset URL (png from HF, svg placeholder fallback). */
export function landingAsset(name: string): string {
  return `${LANDING_BASE}/${name}.png`;
}

export function landingAssetWebp(name: string): string {
  return `${LANDING_BASE}/${name}.webp`;
}

/** Placeholder SVG when PNG not yet generated */
export function landingAssetPlaceholder(name: string): string {
  return `${LANDING_BASE}/${name}.svg`;
}

export const LANDING_HERO_MAIN = landingAsset('hero-main');
export const LANDING_HERO_ACCENT = landingAsset('hero-accent');
export const LANDING_ABOUT_1 = landingAsset('about-1');
export const LANDING_ABOUT_2 = landingAsset('about-2');
export const LANDING_FLORAL_LEFT = landingAsset('floral-left');
export const LANDING_FLORAL_RIGHT = landingAsset('floral-right');
export const LANDING_VIDEO_BANNER = landingAsset('video-banner');
export const LANDING_TESTIMONIAL_1 = landingAsset('testimonial-1');
export const LANDING_TESTIMONIAL_2 = landingAsset('testimonial-2');
export const LANDING_BLOG_1 = landingAsset('blog-1');
export const LANDING_BLOG_2 = landingAsset('blog-2');
export const LANDING_BLOG_3 = landingAsset('blog-3');

/** @deprecated use LANDING_HERO_MAIN */
export const LANDING_HERO_PRODUCT_IMAGE = LANDING_HERO_MAIN;

/** @deprecated use LANDING_VIDEO_BANNER */
export const LANDING_HERO_BACKDROP_IMAGE = LANDING_VIDEO_BANNER;
