'use client';

import { SoftLocaleBanner } from '@/components/seo/SoftLocaleBanner';
import { SiteCompactFooter } from '@/components/shared/SiteCompactFooter';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { MobileTabBar } from '@/components/shared/MobileTabBar';
import { cn } from '@/lib/shared/utils';

interface PublicShellProps {
  children: React.ReactNode;
  className?: string;
  /** When true, show «Мои» instead of login (set by pages that know session). */
  isLoggedIn?: boolean;
}

export function PublicShell({ children, className, isLoggedIn = false }: PublicShellProps) {
  return (
    <div className={cn('min-h-screen bg-[#fcfcfb] font-body text-us-ink', className)}>
      <SoftLocaleBanner />
      <SiteHeader isLoggedIn={isLoggedIn} />
      <main className="pt-[4.75rem] md:pt-[5.5rem]">{children}</main>
      <SiteCompactFooter />
      {/* Reserve the bar's height so the footer is never trapped underneath it. */}
      <div className="h-14 md:hidden" aria-hidden />
      <MobileTabBar isLoggedIn={isLoggedIn} />
    </div>
  );
}
