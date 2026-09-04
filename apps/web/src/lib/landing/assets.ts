/**
 * Landing & marketing visuals.
 *
 * Five constants used to live here pointing into `/assets/templates/luxe-gold/`
 * — a directory that is not in `public/` (and a template slug that is not in the
 * database). Two of them were actually rendered, so they 404'd on every view:
 * the film-grain overlay on the landing page and the blurred backdrop behind
 * the login card. The other three, plus LANDING_DEMO_HREF
 * (`/i/demo?layout=luxe-gold`), had no consumers left at all. All six are gone;
 * the grain is now generated inline in LandingGrain.tsx and the login backdrop
 * uses a real catalog preview.
 */

const LANDING = '/assets/landing';
const PREVIEWS = '/assets/previews';

/** Real catalog artwork, used as the blurred backdrop on /login. */
export const LANDING_LOGIN_BACKDROP = `${PREVIEWS}/aq-bata.webp`;

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
