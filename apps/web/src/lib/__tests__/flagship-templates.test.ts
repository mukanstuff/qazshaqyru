import { describe, expect, it } from 'vitest';
import {
  FLAGSHIP_TEMPLATE_SLUGS,
  TEMPLATE_CONFIGS,
  ALL_TEMPLATE_SLUGS,
  getFlagshipDecorProfile,
  getTemplatePreviewUrl,
  isFlagshipTemplate,
  getTemplateManifest,
} from '@/lib/templates';

describe('flagship templates', () => {
  it('defines exactly one catalog bridge slug; wiring-stub is configs-only', () => {
    expect(FLAGSHIP_TEMPLATE_SLUGS).toEqual(['wedding-luxury']);
    expect(ALL_TEMPLATE_SLUGS).toContain('wedding-luxury');
    expect(ALL_TEMPLATE_SLUGS).toContain('wiring-stub');
    expect(isFlagshipTemplate('wiring-stub')).toBe(false);
  });

  it('wedding-luxury has manifest and assets', () => {
    const cfg = TEMPLATE_CONFIGS['wedding-luxury'];
    expect(cfg).toBeDefined();
    expect(cfg.coverUrl).toContain('/assets/templates/wedding-luxury/');
    expect(cfg.assets.bgTexture).toBeTruthy();
    expect(cfg.assets.overlayGrain).toBeTruthy();
    expect(getFlagshipDecorProfile('wedding-luxury')).toEqual({});
    expect(isFlagshipTemplate('wedding-luxury')).toBe(true);

    const manifest = getTemplateManifest('wedding-luxury');
    expect(manifest?.slug).toBe('wedding-luxury');
    expect(manifest?.sections.length).toBeGreaterThanOrEqual(8);
    expect(manifest?.fields.some((f) => f.key === 'groomName')).toBe(true);
  });

  it('returns preview from cover when no db preview', () => {
    expect(getTemplatePreviewUrl('wedding-luxury', null)).toContain('wedding-luxury');
  });
});
