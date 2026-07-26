import { FONT_FAMILIES } from './constants';
import { TEMPLATE_CONFIGS } from './configs';
import { LEGACY_TEMPLATE_MAP } from './legacy';
import type { TemplateConfig } from './types';

const DEFAULT_SLUG = 'wedding-luxury';

/** Catalog preview: local preview.jpg → DB value → cover hero (avoid bokeh hero in cards). */
export function getTemplatePreviewUrl(slug: string, dbPreview?: string | null): string {
  const resolvedSlug = TEMPLATE_CONFIGS[slug] ? slug : LEGACY_TEMPLATE_MAP[slug];
  if (resolvedSlug && TEMPLATE_CONFIGS[resolvedSlug]) {
    return `/assets/templates/${resolvedSlug}/preview.jpg`;
  }

  if (dbPreview?.trim()) return dbPreview.trim();

  const cfg = TEMPLATE_CONFIGS[slug];
  if (cfg?.coverUrl?.trim()) return cfg.coverUrl.trim();
  return '';
}

export const ALL_TEMPLATE_SLUGS = Object.keys(TEMPLATE_CONFIGS);

export function getTemplate(slug: string): TemplateConfig {
  return TEMPLATE_CONFIGS[slug] ?? TEMPLATE_CONFIGS[DEFAULT_SLUG];
}

export function resolveTemplateKey(key: string): TemplateConfig {
  if (TEMPLATE_CONFIGS[key]) return TEMPLATE_CONFIGS[key];
  if (LEGACY_TEMPLATE_MAP[key]) {
    return TEMPLATE_CONFIGS[LEGACY_TEMPLATE_MAP[key]] ?? TEMPLATE_CONFIGS[DEFAULT_SLUG];
  }
  return TEMPLATE_CONFIGS[DEFAULT_SLUG];
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
