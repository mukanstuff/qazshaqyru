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
          'flex h-11 min-w-[3.5rem] items-center justify-center gap-1.5 rounded-full border px-3 font-body text-[11px] font-medium leading-none tracking-wider transition-all duration-300',
          inverted
            ? 'border-white/20 text-white hover:border-white hover:bg-white/10'
            : 'border-us-accent/20 text-us-ink-muted hover:border-us-accent/50 hover:text-us-accent'
        )}
      >
        <span>{current?.code.toUpperCase()}</span>
        <svg
          className={cn('transition-transform duration-200', open && 'rotate-180')}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-2xl border border-us-border bg-white/95 p-1.5 shadow-us-lg ring-1 ring-black/[0.04] backdrop-blur-xl">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => switchTo(lang.code)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-body text-sm transition-all duration-200',
                locale === lang.code
                  ? 'bg-us-accent/10 font-semibold text-us-accent'
                  : 'text-us-ink-muted hover:bg-us-accent/5 hover:text-us-ink'
              )}
            >
              <span className="text-base">{lang.code === 'ru' ? '🇷🇺' : '🇰🇿'}</span>
              <span className="flex-1">{lang.label}</span>
              {locale === lang.code && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-us-accent text-white">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
