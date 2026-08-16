import prisma from '@/lib/shared/db';

export interface ResolvedTemplate {
  id: string;
  slug: string;
  priceKzt: number;
  nameRu: string;
}

/**
 * Resolve DB template row by slug.
 *
 * Step 1.2 removed the HTML-engine fallback; templates only exist as Prisma
 * `Template` rows now. Step A removed the default-template fallback too: an
 * unknown slug returns `null`, and the caller decides how to surface that
 * (404, redirect, or `ApiError`). This blocks the silent "unknown slug →
 * luxe-gold" substitution that was useful during the HTML→canvas migration
 * but is a foot-gun once real templates live in the catalog.
 */
export async function resolveTemplateBySlug(
  slug: string,
): Promise<ResolvedTemplate | null> {
  return prisma.template.findFirst({
    where: { slug, isActive: true },
    select: { id: true, slug: true, priceKzt: true, nameRu: true },
  });
}

export async function resolveTemplateIdBySlug(slug: string): Promise<string | null> {
  const row = await resolveTemplateBySlug(slug);
  return row?.id ?? null;
}
