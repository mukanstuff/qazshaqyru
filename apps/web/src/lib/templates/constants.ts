/**
 * Internal decor-profile key set. Name is legacy — not product "flagship" copy.
 * `wedding-luxury` is a temporary catalog bridge only (not a quality baseline).
 */
export const FLAGSHIP_TEMPLATE_SLUGS = ['wedding-luxury'] as const;

/* ─── Fonts available in the app ─── */
export const FONT_FAMILIES = {
  /** @deprecated key kept for template configs — maps to Cormorant Garamond */
  cormorant: 'var(--font-display), Georgia, serif',
  /** @deprecated key kept for template configs — maps to Cormorant Garamond */
  playfair: 'var(--font-display), Georgia, serif',
  /** @deprecated key kept for template configs — maps to Onest */
  dmSans: 'var(--font-body), system-ui, sans-serif',
} as const;

export type FontFamily = keyof typeof FONT_FAMILIES;

/** Per-template default music (Pixabay CDN). */
export const TEMPLATE_MUSIC = {
  softStrings: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3',
} as const;

/** Secondary accents — ochre, terracotta, mustard, earthy pastels */
export const BRAND_ACCENTS = {
  gold: '#C5A368',
  ochre: '#C68B3F',
  terracotta: '#C67B5C',
  mustard: '#D4A82A',
  earthPastel: '#D4C4A8',
  blush: '#D4A5A5',
} as const;
