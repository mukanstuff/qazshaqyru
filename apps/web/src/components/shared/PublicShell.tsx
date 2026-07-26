'use client';

import { SoftLocaleBanner } from '@/components/seo/SoftLocaleBanner';
import { SiteCompactFooter } from '@/components/shared/SiteCompactFooter';
import { SiteMarketingHeader } from '@/components/shared/SiteMarketingHeader';
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
      <SiteMarketingHeader isLoggedIn={isLoggedIn} />
      <main className="pt-[4.75rem] md:pt-[5.5rem]">{children}</main>
      <SiteCompactFooter />
    </div>
  );
}
