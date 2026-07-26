import { cookies, headers } from 'next/headers';
import { detectLocaleFromString, DEFAULT_LOCALE, type Locale, type Messages, interpolate } from './shared';
import { ru } from './messages/ru';
import { kz } from './messages/kz';
import { LOCALE_HEADER } from '@/lib/seo/hreflang';

const SERVER_MESSAGES: Record<Locale, Messages> = {
  ru: ru as Messages,
  kz: kz as Messages,
};

function getNestedValue(obj: Messages, path: string): string | null {
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

function tForServer(locale: Locale, key: string): string {
  const primary = getNestedValue(SERVER_MESSAGES[locale], key);
  if (primary) return primary;
  // Fallback to Russian
  if (locale !== 'ru') {
    const fallback = getNestedValue(SERVER_MESSAGES['ru'], key);
    if (fallback) return fallback;
  }
  return key;
}

export async function getI18n(): Promise<{
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
}> {
  const headerStore = await headers();
  const pathLocale = detectLocaleFromString(headerStore.get(LOCALE_HEADER));
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  // Path locale (/kk|/ru rewrite) wins over cookie so Google indexes language correctly.
  const locale =
    headerStore.get(LOCALE_HEADER) != null
      ? pathLocale
      : detectLocaleFromString(cookieLocale) || DEFAULT_LOCALE;

  const t = (key: string, vars?: Record<string, string | number>) => {
    const text = tForServer(locale, key);
    return interpolate(text, vars);
  };

  return { locale, t };
}
