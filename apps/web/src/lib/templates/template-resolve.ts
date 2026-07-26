import prisma from '@/lib/shared/db';
import { TEMPLATE_CONFIGS } from './configs';
import { LEGACY_TEMPLATE_MAP } from './legacy';

const DEFAULT_SLUG = 'wedding-luxury';

export interface ResolvedTemplate {
  id: string;
  slug: string;
  priceKzt: number;
  nameRu: string;
}

/** Map legacy / removed keys to the active catalog template. */
export function normalizeTemplateSlug(slug: string): string {
  if (LEGACY_TEMPLATE_MAP[slug]) return LEGACY_TEMPLATE_MAP[slug];
  if (TEMPLATE_CONFIGS[slug]) return slug;
  return DEFAULT_SLUG;
}

/**
 * Resolve DB template row by slug (source of truth for pricing & orders).
 */
export async function resolveTemplateBySlug(slug: string): Promise<ResolvedTemplate | null> {
  const normalized = normalizeTemplateSlug(slug);
  return prisma.template.findFirst({
    where: { slug: normalized, isActive: true },
    select: { id: true, slug: true, priceKzt: true, nameRu: true },
  });
}

export async function resolveTemplateIdBySlug(slug: string): Promise<string | null> {
  const row = await resolveTemplateBySlug(slug);
  return row?.id ?? null;
}
