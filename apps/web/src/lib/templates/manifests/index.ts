import type { TemplateManifest } from '../manifest-types';
import { WEDDING_LUXURY_MANIFEST } from './wedding-luxury';
import { WIRING_STUB_MANIFEST } from './wiring-stub';

const MANIFESTS: Record<string, TemplateManifest> = {
  'wedding-luxury': WEDDING_LUXURY_MANIFEST,
  'wiring-stub': WIRING_STUB_MANIFEST,
};

export function getTemplateManifest(slug: string): TemplateManifest | null {
  return MANIFESTS[slug] ?? null;
}

export { WEDDING_LUXURY_MANIFEST, WIRING_STUB_MANIFEST };
