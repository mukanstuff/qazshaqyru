'use client';

import { useI18n } from '@/i18n';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/shared/utils';
import { internalToSeoPath } from '@/lib/seo/hreflang';
import { isMarketingHref, pathnameForSeoLocale, toLogicalPath } from '@/lib/seo/locale-path';

interface LanguageSwitcherProps {
  compact?: boolean;
  inverted?: boolean;
}

export function LanguageSwitcher({ compact = false, inverted = false }: LanguageSwitcherProps) {
  const { locale, setLocale, languages } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = languages.find((l) => l.code === locale);

  const switchTo = (next: typeof locale) => {
    setLocale(next);
    setOpen(false);
    const path = pathname || '/';
    if (isMarketingHref(toLogicalPath(path)) || path === '/' || path.startsWith('/kk') || path.startsWith('/ru')) {
      router.push(pathnameForSeoLocale(path, internalToSeoPath(next)));
      return;
    }
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2.5 py-2 font-body text-sm transition-colors',
          inverted
            ? 'text-white/80 hover:bg-white/10 hover:text-white'
            : 'text-us-ink-muted hover:bg-us-accent/6 hover:text-us-accent'
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{compact ? current?.code.toUpperCase() : current?.label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-us-border bg-us-surface py-1 shadow-us-md">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => switchTo(lang.code)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left font-body text-sm transition-colors',
                locale === lang.code
                  ? 'bg-us-accent/8 font-medium text-us-accent'
                  : 'text-us-ink hover:bg-us-accent/5'
              )}
            >
              <span>{lang.code === 'ru' ? '🇷🇺' : '🇰🇿'}</span>
              <span>{lang.label}</span>
              {locale === lang.code && (
                <svg
                  className="ml-auto shrink-0"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
