import prisma from '@/lib/shared/db';
import { CATEGORY_ROUTE_MAP, type CategoryRouteSlug } from '@/lib/templates/template-categories';

/**
 * How many live templates each catalogue category holds.
 *
 * Exists so the landing stops deciding that in code. The celebrations grid used
 * a hardcoded `LIVE_CELEBRATIONS = new Set(['wedding'])`, which means the day a
 * беташар template is published the landing still advertises it as "coming
 * soon" until somebody remembers to edit a constant. Counting the catalogue
 * makes the grid correct by construction, and gives us the per-category numbers
 * the bigger competitor puts on its own category cards.
 */
export type CategoryCounts = Partial<Record<CategoryRouteSlug, number>>;

export async function getCategoryCounts(): Promise<CategoryCounts> {
  try {
    const rows = await prisma.template.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { _all: true },
    });

    const byDbCategory = new Map<string, number>(
      rows.map((r: { category: string; _count: { _all: number } }) => [r.category, r._count._all]),
    );

    const counts: CategoryCounts = {};
    for (const [route, dbCategory] of Object.entries(CATEGORY_ROUTE_MAP)) {
      const n = byDbCategory.get(dbCategory) ?? 0;
      if (n > 0) counts[route as CategoryRouteSlug] = n;
    }
    return counts;
  } catch {
    // A landing that renders without counts is fine; one that 500s is not.
    return {};
  }
}
