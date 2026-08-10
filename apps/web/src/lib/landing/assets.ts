/** Landing & marketing visuals — swap paths when real photos are ready. */

const TEMPLATE = '/assets/templates/luxe-gold';
const LANDING = '/assets/landing';

export const LANDING_DEMO_HREF = '/i/demo?layout=luxe-gold';

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

/** Empty iPhone mockup (transparent screen hole). Content placeholder sits underneath. */
export const LANDING_HERO_IPHONE_MOCKUP = `${LANDING}/hero-iphone-mockup-empty.png`;

/**
 * Transparent screen hole as % of mockup canvas (1857×3096, measured from alpha).
 * Use as CSS inset: top / right / bottom / left.
 */
export const LANDING_HERO_IPHONE_SCREEN_INSET = {
  top: '10.9%',
  right: '18.4%',
  bottom: '8.3%',
  left: '18.4%',
  /** Inner display corner radius ≈ iPhone continuous curve */
  radius: '2.5rem',
} as const;

/** Hero full-bleed background — national ornament (pre-rotated landscape).
 *  Future webp source: export `hero-ornament-pattern.webp` and switch the URL below
 *  (~100 KB vs current 700 KB PNG). Until then, Next/Image with quality=70 reduces
 *  served bytes via its built-in optimiser. */
export const LANDING_HERO_BG = `${LANDING}/hero-ornament-pattern.png`;
export const LANDING_HERO_ORNAMENT = `${LANDING}/hero-ornament-pattern.png`;
/** Reserved for future webp export — keep the import alive. */
export const LANDING_HERO_ORNAMENT_WEBP = `${LANDING}/hero-ornament-pattern.webp`;

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
