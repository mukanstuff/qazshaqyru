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

/** Families that already live on the server as KZ-prefixed woff2 files.
 *  Marck and Unbounded used to be here; their woff2 files were deleted
 *  because neither face can render Kazakh (see KAZAKH_SUBSTITUTE below). */
const SELF_HOSTED = new Set<FontFamily>([
  'Oranienbaum',
  'Monolog',
  'Corinthia',
  'Copperplate',
  'Andantino',
  'Lavanderia',
  'DomainDisplay',
  'CeraBlack',
  'Shelley',
  'Monumenta',
  'Romul',
  'Ametist',
  'GoodVibes',
  'Montserrat',
  'Cormorant',
  'Cormorant Garamond',
]);

/** Map FontFamily tokens → Google Fonts CSS family names (URL-encoded). */
const GOOGLE_FONT_API: Partial<Record<FontFamily, string>> = {
  Inter: 'Inter:wght@400;500;600;700',
  Manrope: 'Manrope:wght@400;500;600;700',
  Montserrat: 'Montserrat:wght@400;500;600;700',
  Nunito: 'Nunito:wght@400;600;700',
  Oswald: 'Oswald:wght@400;500;600;700',
  Raleway: 'Raleway:wght@400;500;600;700',
  'Tenor Sans': 'Tenor+Sans',
  Unbounded: 'Unbounded:wght@400;500;600;700',
  Comfortaa: 'Comfortaa:wght@400;500;600;700',
  Alice: 'Alice',
  // The ital axis is not optional here: these faces are used for the couple's
  // names and for every pull-quote in the catalogue, and without it the browser
  // synthesises an oblique by shearing the roman — which on a Garamond is
  // immediately obvious and is what shipped.
  Cormorant: 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600',
  'Cormorant Garamond': 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600',
  'EB Garamond': 'EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600',
  Forum: 'Forum',
  Lora: 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600',
  Merriweather: 'Merriweather:wght@400;700',
  'Old Standard TT': 'Old+Standard+TT:ital,wght@0,400;0,700;1,400',
  'PT Serif': 'PT+Serif:wght@400;700',
  Philosopher: 'Philosopher:wght@400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
  Prata: 'Prata',
  Spectral: 'Spectral:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500',
  Vollkorn: 'Vollkorn:wght@400;500;600;700',
  'Yeseva One': 'Yeseva+One',
  'Great Vibes': 'Great+Vibes',
  Marck: 'Marck+Script',
  Pacifico: 'Pacifico',
  'Bad Script': 'Bad+Script',
};

/**
 * Kazakh glyph coverage — the reason this map exists.
 *
 * Kazakh needs Ә Ғ Қ Ң Ө Ұ Ү Һ І on top of base Cyrillic. All but Ұұ and Іі
 * live in the Unicode `cyrillic-ext` block (U+0460-052F), NOT in `cyrillic`.
 * A font can therefore pass a naive "does it support Cyrillic?" check and
 * still be unable to write a single Kazakh word — which is exactly what
 * happened here: an earlier pass filtered families on the `cyrillic` subset
 * alone and kept six that cannot render Kazakh at all.
 *
 * Verified 2026-08-27 by measuring real glyph advance widths in a browser
 * (render the char with `"X", monospace` and `"X", serif`; if the two widths
 * differ the glyph fell back and the font does not have it). Do NOT trust the
 * Google Fonts subset list alone: `Unbounded` advertises a `cyrillic-ext`
 * subset but the file contains no Kazakh glyphs.
 *
 * The width test is necessary but NOT sufficient, which is how `Copperplate`
 * survived here until 2026-09-12. A font can carry a Қ that is simply drawn
 * as К: the advance width matches, nothing falls back, and the page spells
 * Kazakh words wrong in a way only a reader notices. The stronger test is
 * geometric — render Қ and К to a canvas at 80px and compare the lowest row
 * of ink. Every usable face in this repo puts Қ 8–26px below К at that size;
 * `KZ Copperplate` puts it 2px below, i.e. nothing. Same for Ң against Н.
 *
 * Leaving such a font in place produces the worst possible result — a single
 * word rendered half in the chosen face and half in a system fallback. So we
 * substitute the whole family instead, keeping the typographic category
 * (display serif → display serif, script → script) as close as we can.
 *
 * These tokens stay in the `FontFamily` union on purpose: removing a union
 * member would make Zod reject every stored canvas document that still uses
 * it, and `parseCanvasOrEmpty` would silently blank the whole invitation.
 * They are hidden from the pickers instead, so no new document can pick one.
 */
interface KazakhSubstitute {
  family: string;
  /** null = the substitute is self-hosted, nothing to fetch from Google. */
  googleParam: string | null;
  fallback: string;
}

export const KAZAKH_SUBSTITUTE: Partial<Record<FontFamily, KazakhSubstitute>> = {
  'Tenor Sans': { family: 'Forum', googleParam: 'Forum', fallback: 'Georgia, serif' },
  'Playfair Display': { family: 'Prata', googleParam: 'Prata', fallback: 'Georgia, serif' },
  Manrope: {
    family: 'Golos Text',
    googleParam: 'Golos+Text:wght@400;500;600;700',
    fallback: 'system-ui, sans-serif',
  },
  Unbounded: {
    family: 'Geologica',
    googleParam: 'Geologica:wght@400;500;600;700',
    fallback: 'system-ui, sans-serif',
  },
  // Both script faces resolve to the self-hosted 'KZ Script' (Caveat) so the
  // guest page keeps rendering names without a round-trip to Google.
  Marck: { family: 'KZ Script', googleParam: null, fallback: 'cursive' },
  'Great Vibes': { family: 'KZ Script', googleParam: null, fallback: 'cursive' },
  // Copperplate is the one that fails the geometric test rather than the width
  // test: it has Қ and Ң, but flattened to К and Н. Montserrat is the nearest
  // genus (engraved gothic → geometric sans) among the self-hosted faces that
  // pass, and unlike Monumenta and Romul it has real lower case.
  Copperplate: { family: 'KZ Montserrat', googleParam: null, fallback: 'system-ui, sans-serif' },
};

/** Families that cannot render Kazakh and must never appear in a picker. */
export const KAZAKH_INCAPABLE_FAMILIES = Object.keys(KAZAKH_SUBSTITUTE) as FontFamily[];

/** Heuristic fallback stacks for each family, so text renders even before
 *  the Google webfont arrives. */
const FALLBACK: Record<FontFamily, string> = {
  // Self-hosted, owner-licensed
  Oranienbaum: 'Georgia, serif',
  Copperplate: 'Georgia, serif',
  Andantino: 'cursive',
  Lavanderia: 'cursive',
  DomainDisplay: 'Georgia, serif',
  CeraBlack: 'system-ui, sans-serif',
  Shelley: 'cursive',
  Monumenta: 'Georgia, serif',
  Romul: 'Georgia, serif',
  Ametist: 'cursive',
  GoodVibes: 'cursive',
  Monolog: 'system-ui, sans-serif',
  Corinthia: 'cursive',
  // Self-hosted (will be KZ-prefixed below)
  Montserrat: 'system-ui, sans-serif',
  Cormorant: 'Georgia, serif',
  'Cormorant Garamond': 'Georgia, serif',
  Marck: 'cursive',
  Unbounded: 'system-ui, sans-serif',
  // Sans
  Inter: 'system-ui, sans-serif',
  Manrope: 'system-ui, sans-serif',
  Nunito: 'system-ui, sans-serif',
  Oswald: 'system-ui, sans-serif',
  Raleway: 'system-ui, sans-serif',
  'Tenor Sans': 'system-ui, sans-serif',
  Comfortaa: 'system-ui, sans-serif',
  system: '-apple-system, sans-serif',
  // Serif
  Alice: 'Georgia, serif',
  'EB Garamond': 'Georgia, serif',
  Forum: 'Georgia, serif',
  Lora: 'Georgia, serif',
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
  'Great Vibes': 'cursive',
  Pacifico: 'cursive',
  'Bad Script': 'cursive',
};

/** Resolve a family token → CSS `font-family` stack. */
export function fontStack(family: FontFamily): string {
  // Kazakh-incapable families are swapped wholesale before anything else, so
  // the substitution applies to every render path (editor, guest page, OG).
  const substitute = KAZAKH_SUBSTITUTE[family];
  if (substitute) return `'${substitute.family}', ${substitute.fallback}`;

  const fallback = FALLBACK[family] ?? 'system-ui, sans-serif';
  if (family === 'system') return fallback;
  if (SELF_HOSTED.has(family)) {
    if (family === 'Oranienbaum') return `'KZ Oranienbaum', ${fallback}`;
    if (family === 'Copperplate') return `'KZ Copperplate', ${fallback}`;
    if (family === 'Andantino') return `'KZ Andantino', ${fallback}`;
    if (family === 'Lavanderia') return `'KZ Lavanderia', ${fallback}`;
    if (family === 'DomainDisplay') return `'KZ Domain', ${fallback}`;
    if (family === 'CeraBlack') return `'KZ Cera Black', ${fallback}`;
    if (family === 'Shelley') return `'KZ Shelley', ${fallback}`;
    if (family === 'Monumenta') return `'KZ Monumenta', ${fallback}`;
    if (family === 'Romul') return `'KZ Romul', ${fallback}`;
    if (family === 'Ametist') return `'KZ Ametist', ${fallback}`;
    if (family === 'GoodVibes') return `'KZ GoodVibes', ${fallback}`;
    if (family === 'Monolog') return `'KZ Monolog', ${fallback}`;
    if (family === 'Corinthia') return `'KZ Corinthia', ${fallback}`;
    if (family === 'Montserrat') return `'KZ Montserrat', 'Montserrat', ${fallback}`;
    if (family === 'Cormorant' || family === 'Cormorant Garamond') {
      return `'KZ Cormorant', 'Cormorant Garamond', ${fallback}`;
    }
  }
  // Google Fonts — quote the family name; fallback covers FOIT.
  return `'${family}', ${fallback}`;
}

/** Lazily inject a Google Fonts <link> for a given family. Idempotent. */
const injected = new Set<string>();

export function ensureGoogleFont(family: FontFamily): void {
  if (typeof document === 'undefined') return;
  if (family === 'system') return;
  // Substituted families load their replacement instead — including the
  // self-hosted ones (Marck, Unbounded), whose local woff2 lacks Kazakh.
  const substitute = KAZAKH_SUBSTITUTE[family];
  if (!substitute && SELF_HOSTED.has(family)) return;
  const apiParam = substitute ? substitute.googleParam : GOOGLE_FONT_API[family];
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

/**
 * Load every family a document uses in a single stylesheet request.
 *
 * Why this exists: `ensureGoogleFont` was only ever called from
 * `EditableTextView`, which mounts in the *editor*. On the guest page — the
 * page every invited person actually opens — no element view called it, so
 * no Google font was ever fetched and every family that is not self-hosted
 * silently fell back to a generic system face. Templates were designed in
 * Forum, Prata, Yeseva One or Pacifico and delivered in Georgia and sans.
 *
 * Batching also matters: one <link> for the whole document avoids a request
 * per element and lets the browser start every face at once instead of
 * discovering them one component at a time.
 */
export function ensureDocumentFonts(families: Iterable<FontFamily>): void {
  if (typeof document === 'undefined') return;

  const params: string[] = [];
  for (const family of new Set(families)) {
    if (family === 'system') continue;
    const substitute = KAZAKH_SUBSTITUTE[family];
    if (!substitute && SELF_HOSTED.has(family)) continue;
    const apiParam = substitute ? substitute.googleParam : GOOGLE_FONT_API[family];
    if (!apiParam || injected.has(apiParam)) continue;
    injected.add(apiParam);
    params.push(apiParam);
  }

  if (params.length === 0) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${params.join('&family=')}&display=swap`;
  document.head.appendChild(link);
}
