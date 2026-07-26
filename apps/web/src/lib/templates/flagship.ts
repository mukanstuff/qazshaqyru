import type { FlagshipDecorProfile, FlagshipTemplateSlug } from './types';
import { FLAGSHIP_TEMPLATE_SLUGS } from './constants';

const FLAGSHIP_DECOR_PROFILES: Record<FlagshipTemplateSlug, FlagshipDecorProfile> = {
  'wedding-luxury': {},
};

export function isFlagshipTemplate(slug: string): slug is FlagshipTemplateSlug {
  return (FLAGSHIP_TEMPLATE_SLUGS as readonly string[]).includes(slug);
}

export function getFlagshipDecorProfile(slug: string): FlagshipDecorProfile | null {
  if (!isFlagshipTemplate(slug)) return null;
  return FLAGSHIP_DECOR_PROFILES[slug];
}
