import { FONT_FAMILIES } from './constants';
import { TEMPLATE_CONFIGS } from './configs';
import type { TemplateConfig } from './types';

/** Catalog preview: local preview.jpg → DB value → cover hero (avoid bokeh hero in cards). */
export function getTemplatePreviewUrl(slug: string, dbPreview?: string | null): string {
  const cfg = TEMPLATE_CONFIGS[slug];
  if (cfg) {
    return `/assets/templates/${slug}/preview.jpg`;
  }

  if (dbPreview?.trim()) return dbPreview.trim();
  return '';
}

export const ALL_TEMPLATE_SLUGS = Object.keys(TEMPLATE_CONFIGS);

export function getTemplate(slug: string): TemplateConfig | undefined {
  return TEMPLATE_CONFIGS[slug];
}

export function resolveTemplateKey(key: string): TemplateConfig | undefined {
  return TEMPLATE_CONFIGS[key];
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