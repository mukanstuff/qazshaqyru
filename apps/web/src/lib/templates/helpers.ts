import { FONT_FAMILIES } from './constants';
import type { TemplateConfig } from './types';

/**
 * The catalogue card's preview image.
 *
 * This used to consult `TEMPLATE_CONFIGS` first and, on a hit, return
 * `/assets/templates/<slug>/preview.jpg` — a path no template has ever had.
 * The lookup table has been an empty object `{}` for a long time, so the branch
 * never fired and the bug stayed invisible: the first template ever added to
 * that table would have lost its card image. The table and the four helpers
 * that only read it are gone; the preview is the column on the row, which is
 * what `scripts/make-previews.ts` writes.
 */
export function getTemplatePreviewUrl(_slug: string, dbPreview?: string | null): string {
  return dbPreview?.trim() ?? '';
}

/** Get the public URL for an asset, or null if not configured */
export function getAssetUrl(slug: string, filename: string | undefined): string | null {
  if (!filename) return null;
  return `/assets/templates/${slug}/${filename}`;
}

/** Heading font CSS value */
export function headingFontCss(cfg: TemplateConfig): string {
  return FONT_FAMILIES[cfg.headingFont];
}

/** Effective music URL: user upload/choice wins, else per-template default */
export function resolveTemplateMusicUrl(
  musicUrl: string | null | undefined,
  cfg: TemplateConfig,
): string | null {
  if (musicUrl?.trim()) return musicUrl.trim();
  return cfg.defaultMusicUrl ?? null;
}

/** Whether template uses dark hero */
export function isDarkHero(cfg: TemplateConfig): boolean {
  return cfg.layout === 'dark-lux';
}
