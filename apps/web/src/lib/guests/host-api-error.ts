/**
 * Map host API `{ error, message }` to locale UI string.
 * Prefer error code → i18n over RU server `message` (KZ host chrome).
 */
export function resolveHostApiError(
  data: { error?: unknown; message?: unknown } | null | undefined,
  t: (key: string) => string,
  fallbackKey: string
): string {
  const code = typeof data?.error === 'string' ? data.error.trim() : '';
  if (code) {
    const key = `dashboard.guestOps.apiErrors.${code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return t(fallbackKey);
}
