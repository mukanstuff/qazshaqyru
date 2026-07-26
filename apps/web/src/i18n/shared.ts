/**
 * Shared TypeScript types and utilities for i18n.
 * NO 'use client' directive — this file can be imported by both client and server components.
 */

export type Locale = 'kz' | 'ru';

export const LOCALE_COOKIE = 'locale';
export const DEFAULT_LOCALE: Locale = 'ru';
export const SUPPORTED_LOCALES: Locale[] = ['ru', 'kz'];

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  kz: 'Қазақша',
};

export function detectLocaleFromString(value: string | undefined | null): Locale {
  if (value === 'kz' || value === 'ru') return value;
  return DEFAULT_LOCALE;
}

/**
 * Type-safe message structure.
 */
export interface MessageValue {
  [key: string]: string | MessageValue | string[] | number | boolean | null | undefined;
}

export type Messages = MessageValue;

/**
 * Get nested value from messages object by dot-notation key.
 */
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

/**
 * Replace variables in a translation string.
 * Supports {variableName} syntax.
 */
export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  let result = text;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return result;
}
