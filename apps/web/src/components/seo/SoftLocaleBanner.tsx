'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { useI18n } from '@/i18n';
import { parseSeoPathLocale } from '@/lib/seo/hreflang';
import {
  isMarketingHref,
  pathnameForSeoLocale,
  preferSeoLocaleFromAcceptLanguage,
  toLogicalPath,
} from '@/lib/seo/locale-path';

const STORAGE_KEY = 'qazshaqyru-soft-locale-dismissed';

/**
 * One-time soft suggest on unprefixed marketing URLs.
 * No hard redirect. Bots never auto-navigate (client-only, dismissible).
 */
export function SoftLocaleBanner() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { setLocale } = useI18n();
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState<'kk' | 'ru' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (parseSeoPathLocale(pathname)) return;
    if (!isMarketingHref(toLogicalPath(pathname))) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      return;
    }
    const preferred = preferSeoLocaleFromAcceptLanguage(navigator.languages?.join(',') || navigator.language);
    setHint(preferred);
    setVisible(true);
  }, [pathname]);

  if (!visible) return null;

  const go = (seo: 'kk' | 'ru') => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setLocale(seo === 'kk' ? 'kz' : 'ru');
    setVisible(false);
    router.push(pathnameForSeoLocale(pathname, seo));
  };

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const kkPrimary = hint === 'kk';
  const ruPrimary = hint === 'ru';

  return (
    <div
      role="region"
      aria-label="Language"
      className="fixed inset-x-0 bottom-0 z-[110] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-md:top-[4.75rem] max-md:bottom-auto md:pb-6"
    >
      <div className="flex w-full max-w-lg items-start gap-3 rounded-2xl border border-us-accent/20 bg-white px-4 py-3 shadow-lg max-md:shadow-md">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-us-ink">
            {hint === 'kk'
              ? 'Тілді таңдаңыз / Выберите язык'
              : 'Выберите язык / Тілді таңдаңыз'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => go('kk')}
              className={`min-h-11 rounded-full px-4 py-2 text-sm transition-colors ${
                kkPrimary
                  ? 'bg-us-accent text-us-cream hover:bg-us-accent-strong'
                  : 'border border-us-accent/25 text-us-ink hover:border-us-accent/45'
              }`}
            >
              Қазақша
            </button>
            <button
              type="button"
              onClick={() => go('ru')}
              className={`min-h-11 rounded-full px-4 py-2 text-sm transition-colors ${
                ruPrimary
                  ? 'bg-us-accent text-us-cream hover:bg-us-accent-strong'
                  : 'border border-us-accent/25 text-us-ink hover:border-us-accent/45'
              }`}
            >
              Русский
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-us-ink-muted hover:bg-black/[0.04] hover:text-us-ink"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
