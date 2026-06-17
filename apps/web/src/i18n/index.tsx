'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ru } from './messages/ru';
import { kz } from './messages/kz';

export type Locale = 'kz' | 'ru';

export const LOCALE_COOKIE = 'locale';
export const DEFAULT_LOCALE: Locale = 'ru';
export const SUPPORTED_LOCALES: Locale[] = ['ru', 'kz'];

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  kz: 'Қазақша',
};

type Messages = Record<string, unknown>;

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

export function detectLocaleFromString(value: string | undefined | null): Locale {
  if (value === 'kz' || value === 'ru') return value;
  return DEFAULT_LOCALE;
}

export function tForLocale(locale: Locale, key: string): string {
  const primary = getNestedValue(ALL_MESSAGES[locale], key);
  if (primary) return primary;
  if (locale !== DEFAULT_LOCALE) {
    const fallback = getNestedValue(ALL_MESSAGES[DEFAULT_LOCALE], key);
    if (fallback) return fallback;
  }
  return key;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languages: { code: Locale; label: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

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

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=(kz|ru)`));
    if (match) {
      const cookieLocale = detectLocaleFromString(match[1]);
      if (cookieLocale !== locale) setLocaleState(cookieLocale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let text = tForLocale(locale, key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return text;
    },
    [locale]
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
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    const t = (key: string) => tForLocale(DEFAULT_LOCALE, key);
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t,
      languages: [
        { code: 'ru' as const, label: LOCALE_LABELS.ru },
        { code: 'kz' as const, label: LOCALE_LABELS.kz },
      ],
    };
  }
  return ctx;
}
