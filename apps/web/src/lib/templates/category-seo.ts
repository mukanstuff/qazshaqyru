import type { Locale } from '@/i18n/shared';
import { CATEGORY_ROUTES, type CategoryRouteSlug } from '@/lib/templates/template-categories';

type MessageTree = Record<string, unknown>;

function getNestedString(obj: MessageTree, path: string): string | null {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (typeof current === 'object' && current !== null && key in (current as object)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

export interface CategoryPageMetadata {
  title: string;
  description: string;
}

export function getCategoryPageMetadata(
  locale: Locale,
  routeSlug: CategoryRouteSlug,
  messages: { ru: MessageTree; kz: MessageTree }
): CategoryPageMetadata {
  const primary = messages[locale];
  const fallback = messages.ru;

  const title =
    getNestedString(primary, `categoryPage.${routeSlug}.metaTitle`) ??
    getNestedString(fallback, `categoryPage.${routeSlug}.metaTitle`) ??
    getNestedString(primary, `categoryPage.${routeSlug}.title`) ??
    routeSlug;

  const description =
    getNestedString(primary, `categoryPage.${routeSlug}.metaDescription`) ??
    getNestedString(fallback, `categoryPage.${routeSlug}.metaDescription`) ??
    getNestedString(primary, `categoryPage.${routeSlug}.subtitle`) ??
    '';

  return { title, description };
}

export function isValidCategoryRoute(route: string): route is CategoryRouteSlug {
  return (CATEGORY_ROUTES as readonly string[]).includes(route);
}
