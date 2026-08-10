/**
 * fontStack — single source of truth for resolving a `FontFamily` token to
 * a CSS `font-family` string, plus lazy Google Fonts loading.
 *
 * Self-hosted families (from /fonts/*.woff2 via kz-fonts.css) use the
 * `KZ <Name>` alias and resolve instantly. Everything else falls back to
 * the Google Fonts CDN, loaded on demand by `ensureGoogleFont(family)`.
 *
 * Why dynamic: the editor must show the chosen font in real time as the
 * user picks it. Loading all 36 Google Fonts eagerly would be wasteful
 * (≈ 2-3 MB). Instead, we inject a single <link> per family the first
 * time it's used and let the browser cache it.
 */

import type { FontFamily } from '@/lib/canvas/types';

/** Families that already live on the server as KZ-prefixed woff2 files. */
const SELF_HOSTED = new Set<FontFamily>([
  'Montserrat',
  'Cormorant',
  'Cormorant Garamond',
  'Marck',
  'Unbounded',
]);

/** Map FontFamily tokens → Google Fonts CSS family names (URL-encoded). */
const GOOGLE_FONT_API: Partial<Record<FontFamily, string>> = {
  Inter: 'Inter:wght@400;500;600;700',
  'Josefin Sans': 'Josefin+Sans:wght@400;500;600;700',
  Manrope: 'Manrope:wght@400;500;600;700',
  Montserrat: 'Montserrat:wght@400;500;600;700',
  Nunito: 'Nunito:wght@400;600;700',
  Oswald: 'Oswald:wght@400;500;600;700',
  Poppins: 'Poppins:wght@400;500;600;700',
  Quicksand: 'Quicksand:wght@400;500;600;700',
  Raleway: 'Raleway:wght@400;500;600;700',
  'Tenor Sans': 'Tenor+Sans',
  Unbounded: 'Unbounded:wght@400;500;600;700',
  'Work Sans': 'Work+Sans:wght@400;500;600;700',
  'Bebas Neue': 'Bebas+Neue',
  Comfortaa: 'Comfortaa:wght@400;500;600;700',
  Alice: 'Alice',
  'Bodoni Moda': 'Bodoni+Moda:wght@400;500;600;700',
  Cardo: 'Cardo:wght@400;700',
  Cinzel: 'Cinzel:wght@400;500;600;700',
  Cormorant: 'Cormorant+Garamond:wght@400;500;600;700',
  'Cormorant Garamond': 'Cormorant+Garamond:wght@400;500;600;700',
  'DM Serif Display': 'DM+Serif+Display',
  'EB Garamond': 'EB+Garamond:wght@400;500;600;700',
  Forum: 'Forum',
  Italiana: 'Italiana',
  'Libre Baskerville': 'Libre+Baskerville:wght@400;700',
  Lora: 'Lora:wght@400;500;600;700',
  Marcellus: 'Marcellus',
  Merriweather: 'Merriweather:wght@400;700',
  'Old Standard TT': 'Old+Standard+TT:wght@400;700',
  'PT Serif': 'PT+Serif:wght@400;700',
  Philosopher: 'Philosopher:wght@400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
  Prata: 'Prata',
  Spectral: 'Spectral:wght@400;500;600;700',
  Vollkorn: 'Vollkorn:wght@400;500;600;700',
  'Yeseva One': 'Yeseva+One',
  'Dancing Script': 'Dancing+Script:wght@400;700',
  'Great Vibes': 'Great+Vibes',
  Marck: 'Marck+Script',
  Pacifico: 'Pacifico',
  Parisienne: 'Parisienne',
  Sacramento: 'Sacramento',
  Tangerine: 'Tangerine:wght@400;700',
};

/** Heuristic fallback stacks for each family, so text renders even before
 *  the Google webfont arrives. */
const FALLBACK: Record<FontFamily, string> = {
  // Self-hosted (will be KZ-prefixed below)
  Montserrat: 'system-ui, sans-serif',
  Cormorant: 'Georgia, serif',
  'Cormorant Garamond': 'Georgia, serif',
  Marck: 'cursive',
  Unbounded: 'system-ui, sans-serif',
  // Sans
  Inter: 'system-ui, sans-serif',
  'Josefin Sans': 'system-ui, sans-serif',
  Manrope: 'system-ui, sans-serif',
  Nunito: 'system-ui, sans-serif',
  Oswald: 'system-ui, sans-serif',
  Poppins: 'system-ui, sans-serif',
  Quicksand: 'system-ui, sans-serif',
  Raleway: 'system-ui, sans-serif',
  'Tenor Sans': 'system-ui, sans-serif',
  'Work Sans': 'system-ui, sans-serif',
  'Bebas Neue': 'system-ui, sans-serif',
  Comfortaa: 'system-ui, sans-serif',
  system: '-apple-system, sans-serif',
  // Serif
  Alice: 'Georgia, serif',
  'Bodoni Moda': 'Georgia, serif',
  Cardo: 'Georgia, serif',
  Cinzel: 'Georgia, serif',
  'DM Serif Display': 'Georgia, serif',
  'EB Garamond': 'Georgia, serif',
  Forum: 'Georgia, serif',
  Italiana: 'Georgia, serif',
  'Libre Baskerville': 'Georgia, serif',
  Lora: 'Georgia, serif',
  Marcellus: 'Georgia, serif',
  Merriweather: 'Georgia, serif',
  'Old Standard TT': 'Georgia, serif',
  'PT Serif': 'Georgia, serif',
  Philosopher: 'Georgia, serif',
  'Playfair Display': 'Georgia, serif',
  Prata: 'Georgia, serif',
  Spectral: 'Georgia, serif',
  Vollkorn: 'Georgia, serif',
  'Yeseva One': 'Georgia, serif',
  // Script
  'Dancing Script': 'cursive',
  'Great Vibes': 'cursive',
  Pacifico: 'cursive',
  Parisienne: 'cursive',
  Sacramento: 'cursive',
  Tangerine: 'cursive',
};

/** Resolve a family token → CSS `font-family` stack. */
export function fontStack(family: FontFamily): string {
  const fallback = FALLBACK[family] ?? 'system-ui, sans-serif';
  if (family === 'system') return fallback;
  if (SELF_HOSTED.has(family)) {
    // Map KZ Onest to all self-hosted slots that should pick up the
    // modern geometric sans, but keep Cormorant / Marck / Unbounded
    // for ceremonial text.
    if (family === 'Montserrat') return `'KZ Montserrat', 'Montserrat', ${fallback}`;
    if (family === 'Cormorant' || family === 'Cormorant Garamond') {
      return `'KZ Cormorant', 'Cormorant Garamond', ${fallback}`;
    }
    if (family === 'Marck') return `'KZ Marck', 'Marck Script', ${fallback}`;
    if (family === 'Unbounded') return `'KZ Unbounded', 'Unbounded', ${fallback}`;
  }
  // Google Fonts — quote the family name; fallback covers FOIT.
  return `'${family}', ${fallback}`;
}

/** Lazily inject a Google Fonts <link> for a given family. Idempotent. */
const injected = new Set<string>();

export function ensureGoogleFont(family: FontFamily): void {
  if (typeof document === 'undefined') return;
  if (SELF_HOSTED.has(family) || family === 'system') return;
  const apiParam = GOOGLE_FONT_API[family];
  if (!apiParam) return;
  if (injected.has(apiParam)) return;
  injected.add(apiParam);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${apiParam}&display=swap`;
  document.head.appendChild(link);
}

/**
 * Convenience: returns the stack AND triggers the lazy load. Use in
 * components that actually render the font. (Name kept for back-compat
 * with early consumers — semantically a "load and resolve".)
 */
export function loadAndResolveFont(family: FontFamily): string {
  ensureGoogleFont(family);
  return fontStack(family);
}
