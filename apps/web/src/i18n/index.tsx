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

const LANGUAGES = [
  { code: 'ru' as const, label: LOCALE_LABELS.ru },
  { code: 'kz' as const, label: LOCALE_LABELS.kz },
];

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

  const value = useMemo<I18nContextType>(
    () => ({ locale, setLocale, t, languages: LANGUAGES, messages }),
    [locale, setLocale, t, messages]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Stable fallback for trees rendered without <I18nProvider>.
 *
 * This MUST be a module-level singleton. It used to be an object literal built
 * inside useI18n(), so every render handed the caller a brand-new `t` — and
 * `t` is in the dependency array of ~20 effects and callbacks across the app
 * (HubSectionList, InvitationRowActions, TemplatesClient, LayoutRouter…). Any
 * one of them rendered outside the provider would re-run forever. Same defect
 * that made useToast() spin the template builder into an endless refetch.
 */
const FALLBACK_MESSAGES = ALL_MESSAGES[DEFAULT_LOCALE];
const FALLBACK_I18N: I18nContextType = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string, vars?: Record<string, string | number>) =>
    interpolate(tForLocale(DEFAULT_LOCALE, FALLBACK_MESSAGES, key), vars),
  languages: LANGUAGES,
  messages: FALLBACK_MESSAGES,
};

export function useI18n() {
  return useContext(I18nContext) ?? FALLBACK_I18N;
}

/**
 * Export messages for server-side use.
 * Use getI18n() from server.ts instead.
 */
export { ALL_MESSAGES };
