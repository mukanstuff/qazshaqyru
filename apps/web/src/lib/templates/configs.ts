import { frameAssets, withOverlays, asset } from './asset-bundles';
import { TEMPLATE_MUSIC } from './constants';
import type { TemplateConfig } from './types';

/** Wedding-luxury — temporary catalog bridge (not a quality baseline). */
export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  'wedding-luxury': {
    slug: 'wedding-luxury',
    layout: 'fullbleed',
    coverUrl: asset('wedding-luxury', 'hero/hero-01.webp'),
    coverAlt: 'Свадебное приглашение wedding-luxury',
    accent: '#6e6845',
    textLight: '#faf8f5',
    textDark: '#6e6845',
    bgSection: 'bg-neutral-50',
    bgAlt: 'bg-white',
    headingFont: 'cormorant',
    overlayGradient:
      'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.5) 100%)',
    animationClass: 'tpl-motion-luxe',
    defaultMusicUrl: TEMPLATE_MUSIC.softStrings,
    assets: withOverlays(
      frameAssets({
        bgTexture: 'backgrounds/bg-paper-01.webp',
        bgCover: 'hero/hero-01.webp',
        divider: 'dividers/divider-01.png',
        dividerThin: 'dividers/divider-02.png',
        frameInner: 'ornaments/frame-01.png',
      }),
    ),
  },
  /** Dev/test fixture — not in sales catalog. */
  'wiring-stub': {
    slug: 'wiring-stub',
    layout: 'fullbleed',
    coverUrl: asset('wedding-luxury', 'hero/hero-01.webp'),
    coverAlt: 'Wiring stub',
    accent: '#6e6845',
    textLight: '#faf8f5',
    textDark: '#3f3a2e',
    bgSection: 'bg-neutral-50',
    bgAlt: 'bg-white',
    headingFont: 'cormorant',
    overlayGradient:
      'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.5) 100%)',
    animationClass: 'tpl-motion-luxe',
    defaultMusicUrl: TEMPLATE_MUSIC.softStrings,
    assets: {},
  },
};
