/** Landing & marketing visuals — swap paths when real photos are ready. */

const TEMPLATE = '/assets/templates/wedding-luxury';
const LANDING = '/assets/landing';

export const LANDING_DEMO_HREF = '/i/demo?layout=wedding-luxury';

export const LANDING_HERO_POSTER = `${TEMPLATE}/hero/hero-poster.webp`;
export const LANDING_HERO_SCREEN = `${TEMPLATE}/preview.jpg`;

export const LANDING_TEXTURE_GRAIN = `${TEMPLATE}/overlays/overlay-grain-01.webp`;
export const LANDING_TEXTURE_PAPER = `${TEMPLATE}/backgrounds/bg-paper-01.webp`;

/** User-provided celebration photography */
export const LANDING_TOY_PHOTOS = {
  astanaWedding: `${LANDING}/toy-astana-wedding.jpg`,
  danceHall: `${LANDING}/toy-dance-hall.jpg`,
  dombraCeremony: `${LANDING}/toy-dombra-ceremony.jpg`,
  hallBlue: `${LANDING}/toy-hall-blue.jfif`,
  hallLimo: `${LANDING}/toy-hall-limo.jfif`,
} as const;

/** Full iPhone mockup (transparent screen hole). Screen content sits underneath. */
export const LANDING_HERO_IPHONE_MOCKUP = `${LANDING}/hero-iphone-mockup.webp`;
export const LANDING_HERO_IPHONE_MOCKUP_PNG = `${LANDING}/hero-iphone-mockup.png`;

/**
 * Transparent screen hole as % of mockup canvas (1570×2932, measured from alpha).
 * Use as CSS inset: top / right / bottom / left.
 */
export const LANDING_HERO_IPHONE_SCREEN_INSET = {
  top: '10.4%',
  right: '12.74%',
  bottom: '6.82%',
  left: '12.74%',
  /** Inner display corner radius ≈ iPhone continuous curve */
  radius: '2.35rem',
} as const;

/** Hero full-bleed background — national ornament (pre-rotated landscape). */
export const LANDING_HERO_BG = `${LANDING}/hero-ornament-pattern.png`;
export const LANDING_HERO_ORNAMENT = `${LANDING}/hero-ornament-pattern.png`;

export const CELEBRATION_IMAGES = {
  wedding: LANDING_TOY_PHOTOS.astanaWedding,
  toy: LANDING_TOY_PHOTOS.dombraCeremony,
  betashar: LANDING_TOY_PHOTOS.danceHall,
  kudalyk: LANDING_TOY_PHOTOS.hallLimo,
  uzatu: LANDING_TOY_PHOTOS.astanaWedding,
  anniversary: LANDING_TOY_PHOTOS.hallBlue,
  shildehana: LANDING_TOY_PHOTOS.hallBlue,
} as const;

export const TESTIMONIAL_PHOTOS = [
  LANDING_TOY_PHOTOS.astanaWedding,
  LANDING_TOY_PHOTOS.dombraCeremony,
  LANDING_TOY_PHOTOS.danceHall,
] as const;

export type CelebrationKey = keyof typeof CELEBRATION_IMAGES;
