/** URL slug → Prisma Template.category */
export const CATEGORY_ROUTE_MAP = {
  wedding: 'wedding',
  toy: 'toy',
  betashar: 'betashar',
  'kyz-uzatu': 'kyz_uzatu',
  'sundet-toy': 'sundet_toy',
  'tusau-keser': 'tusau_keser',
  birthday: 'birthday',
  anniversary: 'anniversary',
  corporate: 'corporate',
} as const;

export type CategoryRouteSlug = keyof typeof CATEGORY_ROUTE_MAP;

export const CATEGORY_ROUTES = Object.keys(CATEGORY_ROUTE_MAP) as CategoryRouteSlug[];

export function resolveCategoryFromRoute(routeSlug: string): string | null {
  return CATEGORY_ROUTE_MAP[routeSlug as CategoryRouteSlug] ?? null;
}

export function categoryRouteFromDb(category: string): CategoryRouteSlug | null {
  const entry = Object.entries(CATEGORY_ROUTE_MAP).find(([, db]) => db === category);
  return (entry?.[0] as CategoryRouteSlug) ?? null;
}

/** Prisma / events.* key from route slug (kyz-uzatu → kyz_uzatu). */
export function categoryDbKeyFromRoute(routeSlug: CategoryRouteSlug): string {
  return CATEGORY_ROUTE_MAP[routeSlug];
}
