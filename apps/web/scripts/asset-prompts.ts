/**
 * Prompt manifest for template artwork.
 *
 * Two kinds, and the difference is architectural, not stylistic:
 *
 *  - `mask`  — becomes an `ornament` element. OrnamentElementView renders the
 *              SVG/PNG as a CSS mask and fills it with the *theme's* accent
 *              colour, so one ornament serves every palette. These must be
 *              generated as pure black line art on pure white with no shading
 *              or grey, because the post-processing step keys luminance to
 *              alpha. Any grey turns into a half-transparent smear.
 *
 *  - `image` — becomes an ordinary `image` element and keeps its own colour:
 *              watercolour grounds, painted florals, textures.
 *
 *  - `foil`  — coloured artwork that still needs its background removed: a
 *              gold-leaf ornament is not line art (keying luminance to alpha
 *              would erase the highlights that make it read as metal) and not a
 *              plain image (the white square around it would sit on the page).
 *              Generated on pure white, keyed white → transparent with the
 *              colour left intact.
 *
 * Keep prompts explicit about "no text" — image models like adding lettering
 * to anything that looks like an invitation, and a wrong-language word baked
 * into an ornament makes the asset unusable.
 */

export type AssetKind = 'mask' | 'image' | 'foil';

export interface AssetPrompt {
  id: string;
  kind: AssetKind;
  prompt: string;
  /** Included in the small first batch used to check style before bulk runs. */
  probe?: boolean;
  /** Target width in px after post-processing. */
  width?: number;
}

const LINE_ART_RULES =
  'Pure black line art on a pure white background. No grey, no shading, no gradients, ' +
  'no fill, no drop shadow, no colour. Thin elegant strokes of even weight. ' +
  'Perfectly centred with even margins. No text, no letters, no numbers, no watermark.';

const PAINT_RULES =
  'Soft watercolour painting, delicate and pale, generous white space, ' +
  'no harsh edges. No text, no letters, no numbers, no watermark, no border frame.';

export const ASSET_PROMPTS: AssetPrompt[] = [
  // ── Section backgrounds ──────────────────────────────────────────────────
  // These replaced the original plan of many small tintable ornaments. A
  // competitor hero is a *single* composed image (toi.com.kz ships one
  // `hero-bg.webp` with its arch and florals already painted together), which
  // is both easier to generate well and better looking than assembling parts.
  //
  // They are painted directly on the template's own parchment (#f7f2e9), so
  // no background removal is needed — keying colour watercolour to alpha by
  // luminance would destroy the pale washes.
  {
    id: 'hero-bg',
    kind: 'image',
    width: 1180,
    prompt:
      `A vertical wedding invitation background on a warm parchment ground, hex #f7f2e9. ` +
      `A tall slender arch drawn in fine muted gold linework rises from the lower third. ` +
      `Delicate watercolour botanicals in dusty sage, soft ochre and pale blush grow up ` +
      `both outer edges and spill lightly over the arch. Muted antique gold, nothing bright ` +
      `or saturated. The entire centre of the image is left completely empty and clean for ` +
      `text. Soft, airy, understated, printed-card feel. No text, no lettering.`,
  },
  {
    id: 'divider',
    kind: 'image',
    width: 1180,
    prompt:
      `A horizontal ornamental divider on a warm parchment ground, hex #f7f2e9. A slender ` +
      `symmetrical flourish of fine muted gold linework at the centre, with a few small ` +
      `watercolour leaves in dusty sage and pale blush on either side, thinning out toward ` +
      `the edges. Wide and short, generous empty space above and below. Delicate and ` +
      `restrained. No text, no lettering.`,
  },
  {
    id: 'closing-bg',
    kind: 'image',
    width: 1180,
    prompt:
      `A vertical wedding invitation background on a warm parchment ground, hex #f7f2e9. ` +
      `A soft watercolour garland of sage eucalyptus, pale blush blossoms and fine muted ` +
      `gold sprigs arcs across the lower portion of the frame, with a scattering of small ` +
      `leaves near the top corners. The middle of the image stays open and empty for text. ` +
      `Muted, faded, printed-card feel. No text, no lettering.`,
  },

  // ── Altyn Oyu ────────────────────────────────────────────────────────────
  //
  // Every template in this market — ours and both references — is painted on
  // cream. This is the one that is not: graphite paper, antique gold, and light
  // rather than paint doing the decorating.
  //
  // Two kinds here. The three grounds are photographed surfaces and keep their
  // own colour. The two foil pieces are gold ornament shot on white so the
  // white can be keyed to alpha, which is why they say "pure flat white
  // background" — a gradient or a shadow behind them cannot be removed cleanly.
  //
  // Line ornament that has to *draw itself* on scroll stays as inline SVG
  // (components/canvas/elements/oyu-ornaments.tsx); a raster has no strokes to
  // walk. These are the pieces where richness beats motion.

  {
    id: 'oyu-ground-hero',
    kind: 'image',
    width: 1180,
    probe: true,
    prompt:
      `Vertical 2:3 portrait background for a luxury wedding invitation. ` +
      `A sheet of heavy handmade cotton paper dyed near-black graphite, hex #14171b, ` +
      `photographed straight on under a single warm low light. ` +
      `Visible natural fibre and tooth in the paper. A soft antique-gold glow rises from ` +
      `the lower third of the sheet and falls away to near-total darkness at the top and ` +
      `in all four corners. A scattering of very fine gold leaf flecks catches the light, ` +
      `denser inside the glow, almost absent at the edges. Deep, moody, expensive, ` +
      `restrained. The upper two thirds must stay clean, even and completely empty — it ` +
      `carries text. No ornament, no pattern, no objects, no text, no lettering, no ` +
      `numbers, no watermark, no border, no frame, no vignette drawn as a hard edge.`,
  },
  {
    id: 'oyu-ground-mid',
    kind: 'image',
    width: 1180,
    prompt:
      `Vertical 2:3 portrait texture. The same sheet of heavy handmade cotton paper dyed ` +
      `near-black graphite, hex #14171b, photographed straight on under flat even light. ` +
      `Natural fibre and tooth visible across the whole surface, with a sparse scattering ` +
      `of very fine gold leaf flecks. Absolutely even from edge to edge and corner to ` +
      `corner: no glow, no vignette, no gradient, no focal point, no lighter or darker ` +
      `region anywhere. It will be tiled against copies of itself, so the four edges must ` +
      `match in tone. Very dark and very quiet. No ornament, no text, no lettering, no ` +
      `numbers, no watermark, no border.`,
  },
  {
    id: 'oyu-ground-closing',
    kind: 'image',
    width: 1180,
    prompt:
      `Vertical 2:3 portrait background for a luxury wedding invitation. ` +
      `The same heavy handmade cotton paper dyed near-black graphite, hex #14171b, with ` +
      `visible fibre and tooth. A warm antique-gold glow pools along the very bottom edge ` +
      `of the sheet, as if a candle stood just below the frame, and fades upward into ` +
      `complete darkness by the middle. Fine gold leaf flecks drift through the glow. ` +
      `The upper half must stay clean, even and completely empty — it carries text. ` +
      `Deep, moody, expensive. No ornament, no objects, no text, no lettering, no ` +
      `numbers, no watermark, no border, no frame.`,
  },
  {
    id: 'oyu-crest-foil',
    kind: 'foil',
    width: 900,
    probe: true,
    prompt:
      `A single Kazakh qoshqar muyiz ram's-horn ornament: two mirrored spirals joined at ` +
      `a common base, each curling outward and then inward on a tightening radius, one ` +
      `symmetrical motif, horizontally symmetrical. Rendered as real antique gold leaf ` +
      `pressed into the surface — visible hammered texture, warm highlights along the ` +
      `outer curve, deeper shadow inside each curl, slightly worn at the edges. Rich old ` +
      `gold, not yellow, not shiny brass, not plastic. ` +
      `Centred in the frame with an even margin on all four sides, at a straight-on angle, ` +
      `on a pure flat white background with no shadow, no gradient, no reflection and no ` +
      `surface under it. Square framing. ` +
      `No text, no lettering, no numbers, no watermark, no border, no extra ornaments.`,
  },
  {
    id: 'oyu-band-foil',
    kind: 'foil',
    width: 1400,
    prompt:
      `A wide, short, horizontally symmetrical Kazakh ornamental divider band. A small ` +
      `lozenge on the centre axis, one ram's-horn spiral curling upward on each side of ` +
      `it, then a fine straight rule running outward to a smaller spiral and ending in a ` +
      `small round bud. One continuous slender band, nothing stacked. ` +
      `Rendered as real antique gold leaf with hammered texture, warm highlights and soft ` +
      `shadow inside the curls. Rich old gold, not yellow, not brass. ` +
      `Centred with generous empty space above and below, straight-on angle, on a pure ` +
      `flat white background with no shadow, no gradient and no surface under it. ` +
      `No text, no lettering, no numbers, no watermark, no border.`,
  },

  // ── Frames and arches ────────────────────────────────────────────────────
  {
    id: 'arch-frame-slim',
    kind: 'mask',
    probe: true,
    width: 900,
    prompt:
      `An elegant wedding invitation arch frame, tall and narrow, portrait orientation. ` +
      `A rounded arch head on straight vertical columns, open at the bottom. ` +
      `A double parallel outline with a small finial ornament at the apex. ` +
      `Fine engraved decorative detail. ${LINE_ART_RULES}`,
  },
  {
    id: 'arch-frame-ornate',
    kind: 'mask',
    width: 900,
    prompt:
      `An ornate wedding arch frame, portrait orientation, rounded top on straight sides. ` +
      `Scrollwork and filigree along the columns, a crest ornament at the apex, ` +
      `small rosettes where the arch springs from the columns. ${LINE_ART_RULES}`,
  },
  {
    id: 'frame-rect-deco',
    kind: 'mask',
    width: 900,
    prompt:
      `A rectangular decorative border frame for a wedding invitation, portrait orientation, ` +
      `with ornamental corners and a small flourish at the centre of each side. ` +
      `${LINE_ART_RULES}`,
  },

  // ── Botanical ────────────────────────────────────────────────────────────
  {
    id: 'sprig-eucalyptus',
    kind: 'mask',
    probe: true,
    width: 600,
    prompt:
      `A single slender eucalyptus sprig, tall and vertical, leaves alternating along ` +
      `a gently curving stem, botanical illustration style. ${LINE_ART_RULES}`,
  },
  {
    id: 'corner-floral',
    kind: 'mask',
    width: 700,
    prompt:
      `A corner floral spray for a wedding invitation: roses, buds and leaves arranged ` +
      `to sit in the top-left corner of a page, radiating inward. ` +
      `Botanical engraving style. ${LINE_ART_RULES}`,
  },
  {
    id: 'wreath-round',
    kind: 'mask',
    width: 800,
    prompt:
      `A circular botanical wreath of leaves and small blossoms, open at the top, ` +
      `symmetrical, botanical engraving style. ${LINE_ART_RULES}`,
  },

  // ── Rules and separators ─────────────────────────────────────────────────
  {
    id: 'rule-flourish',
    kind: 'mask',
    probe: true,
    width: 800,
    prompt:
      `A horizontal decorative divider rule for a wedding invitation: two tapering ` +
      `hairlines meeting a small central ornament, wide and very short, ` +
      `symmetrical. ${LINE_ART_RULES}`,
  },
  {
    id: 'rule-botanical',
    kind: 'mask',
    width: 800,
    prompt:
      `A horizontal botanical divider: a slender branch with small leaves spreading ` +
      `symmetrically from a centre point, wide and short. ${LINE_ART_RULES}`,
  },

  // ── Painted grounds ──────────────────────────────────────────────────────
  {
    id: 'wash-cream',
    kind: 'image',
    probe: true,
    width: 900,
    prompt:
      `A pale cream and ivory watercolour wash background, portrait orientation, ` +
      `very soft, subtle warm blush and sage tints bleeding gently into cream, ` +
      `paper texture visible, nothing in the centre. ${PAINT_RULES}`,
  },
  {
    id: 'wash-sage',
    kind: 'image',
    width: 900,
    prompt:
      `A pale sage green and ivory watercolour wash background, portrait orientation, ` +
      `muted and airy, soft edges, paper texture, empty centre. ${PAINT_RULES}`,
  },
  {
    id: 'floral-garland-painted',
    kind: 'image',
    width: 900,
    prompt:
      `A vertical garland of blush roses, cream peonies and sage eucalyptus leaves, ` +
      `painted in soft watercolour, arranged as a slim column to run down the left ` +
      `edge of a page, on a plain white background. ${PAINT_RULES}`,
  },
];

export const PROBE_PROMPTS = ASSET_PROMPTS.filter((p) => p.probe);
