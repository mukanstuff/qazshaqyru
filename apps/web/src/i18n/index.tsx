'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ru } from './messages/ru';
import { kz } from './messages/kz';
import {
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  detectLocaleFromString,
  type Locale,
  type Messages,
  interpolate,
} from './shared';

export { LOCALE_COOKIE, DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_LABELS, detectLocaleFromString } from './shared';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languages: { code: Locale; label: string }[];
  messages: Messages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const ALL_MESSAGES: Record<Locale, Messages> = {
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

function tForLocale(locale: Locale, messages: Messages, key: string): string {
  const primary = getNestedValue(messages, key);
  if (primary) return primary;
  // Fallback to Russian
  if (locale !== 'ru') {
    const fallback = getNestedValue(ALL_MESSAGES['ru'], key);
    if (fallback) return fallback;
  }
  return key;
}

function setLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const messages = useMemo(() => ALL_MESSAGES[locale], [locale]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=(kz|ru)`));
    if (match) {
      const cookieLocale = detectLocaleFromString(match[1]);
      setLocaleState(cookieLocale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const text = tForLocale(locale, messages, key);
      return interpolate(text, vars);
    },
    [locale, messages]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        languages: [
          { code: 'ru', label: LOCALE_LABELS.ru },
          { code: 'kz', label: LOCALE_LABELS.kz },
        ],
        messages,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Return a default value when used outside I18nProvider
    const defaultMessages = ALL_MESSAGES[DEFAULT_LOCALE];
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string) => tForLocale(DEFAULT_LOCALE, defaultMessages, key),
      languages: [
        { code: 'ru' as const, label: LOCALE_LABELS.ru },
        { code: 'kz' as const, label: LOCALE_LABELS.kz },
      ],
      messages: defaultMessages,
    };
  }
  return ctx;
}

/**
 * Export messages for server-side use.
 * Use getI18n() from server.ts instead.
 */
export { ALL_MESSAGES };
