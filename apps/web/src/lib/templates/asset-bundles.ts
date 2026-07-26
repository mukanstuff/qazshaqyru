import type { TemplateConfig } from './types';

/* ─── Asset paths (base URL for public assets) ─── */
export function asset(slug: string, filename: string): string {
  return `/assets/templates/${slug}/${filename}`;
}

/* ─── Combinatorial asset bundles (wedding-luxury structure) ─── */
const FRAME_CORNERS = {
  flowerTl: 'ornaments/corner-01.png',
  flowerTr: 'ornaments/corner-02.png',
  flowerBl: 'ornaments/corner-03.png',
  flowerBr: 'ornaments/corner-04.png',
} as const;

const FLAT_CORNERS = {
  flowerTl: 'flower-tl.png',
  flowerTr: 'flower-tr.png',
  flowerBl: 'flower-bl.png',
  flowerBr: 'flower-br.png',
} as const;

type FrameBundleOpts = {
  bgTexture: string;
  bgCover: string;
  divider?: string;
  dividerThin?: string;
  frameInner?: string;
};

export function frameAssets(opts: FrameBundleOpts): TemplateConfig['assets'] {
  return {
    bgTexture: opts.bgTexture,
    bgCover: opts.bgCover,
    ...FRAME_CORNERS,
    divider: opts.divider ?? 'dividers/divider-01.png',
    dividerThin: opts.dividerThin ?? 'dividers/divider-02.png',
    frameInner: opts.frameInner ?? 'ornaments/frame-01.png',
  };
}

export function flatAssets(opts: { bgTexture: string; bgCover: string; divider?: string; dividerThin?: string }): TemplateConfig['assets'] {
  return {
    bgTexture: opts.bgTexture,
    bgCover: opts.bgCover,
    ...FLAT_CORNERS,
    divider: opts.divider ?? 'divider.png',
    dividerThin: opts.dividerThin ?? 'divider-h.png',
  };
}

const OVERLAY_GRAIN = 'overlays/overlay-grain-01.webp';
const OVERLAY_VIGNETTE = 'overlays/overlay-vignette-01.webp';

/** Attach standard grain + vignette overlays when present in template folder. */
export function withOverlays(assets: TemplateConfig['assets']): TemplateConfig['assets'] {
  return {
    ...assets,
    overlayGrain: OVERLAY_GRAIN,
    overlayVignette: OVERLAY_VIGNETTE,
  };
}
