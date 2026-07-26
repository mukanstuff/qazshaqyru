'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { LogoMark } from '@/components/shared/ornaments';
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

interface AppHeaderProps {
  variant?: 'dashboard' | 'admin';
  action?: React.ReactNode;
}

export function AppHeader({ variant = 'dashboard', action }: AppHeaderProps) {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 py-3 sm:px-4 sm:py-4">
      <div
        className={cn(
          'pointer-events-auto us-chrome-pill mx-auto max-w-[1120px] rounded-full',
          scrolled && 'shadow-us-md'
        )}
      >
        <div className="flex min-h-16 items-center gap-3 px-3.5 py-2.5 sm:px-4">
          <Link
            href={variant === 'admin' ? '/admin' : '/dashboard'}
            className="inline-flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <LogoMark size={24} color="var(--us-accent)" />
            <div className="min-w-0">
              <span className="block truncate font-display text-lg text-us-ink sm:text-xl">
                {t('landing.brandName')}
              </span>
              <span className="block truncate text-[10px] uppercase tracking-[0.24em] text-us-ink-muted">
                {variant === 'admin' ? 'Admin' : t('landing.headerTagline')}
              </span>
            </div>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {action}
            {variant === 'dashboard' && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="min-h-11 min-w-11 rounded-full text-us-ink-muted hover:bg-us-accent/6 hover:text-us-accent"
              >
                <Link href="/settings" title={t('settings.title')} aria-label={t('settings.title')}>
                  <Settings />
                </Link>
              </Button>
            )}
            <LanguageSwitcher compact />
            {(variant === 'dashboard' || variant === 'admin') && <LogoutButton />}
          </div>
        </div>
      </div>
    </header>
  );
}
