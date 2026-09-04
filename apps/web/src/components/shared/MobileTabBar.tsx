'use client';

import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Plus, User } from 'lucide-react';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

/**
 * Persistent bottom navigation on phones.
 *
 * The site's only navigation was a header that scrolls away, so on a phone the
 * main action — start an invitation — was reachable only by scrolling back to
 * the top or hunting through a menu. A fixed bar keeps the catalogue and the
 * create action one thumb-press away for the whole visit, and it is the single
 * change that most makes the site read as a product rather than a brochure.
 *
 * Deliberately four slots and deliberately icon+label: icons alone are guessing
 * games for the older half of this audience, who are exactly the people being
 * sent an invitation link by their children.
 *
 * Not mounted on the guest invitation page or in the editor — both own their
 * full screen, and covering somebody's wedding invitation with our chrome is
 * the one thing this must never do.
 */
export function MobileTabBar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const { t } = useI18n();
  const pathname = usePathname() || '/';

  // Locale prefixes are part of the public URLs, so strip them before matching.
  const path = pathname.replace(/^\/(ru|kz|kk)(?=\/|$)/, '') || '/';

  const items = [
    { href: '/', icon: Home, label: t('landing.v2.nav.home'), match: (p: string) => p === '/' },
    {
      href: '/templates',
      icon: LayoutGrid,
      label: t('landing.v2.nav.templates'),
      match: (p: string) => p.startsWith('/templates'),
    },
    {
      href: '/templates',
      icon: Plus,
      label: t('landing.v2.nav.createShort'),
      match: () => false,
      primary: true,
    },
    {
      href: isLoggedIn ? '/dashboard' : '/login',
      icon: User,
      label: isLoggedIn ? t('landing.v2.nav.myInvitations') : t('landing.v2.nav.login'),
      match: (p: string) => p.startsWith('/dashboard') || p.startsWith('/login'),
    },
  ];

  return (
    <nav
      aria-label={t('landing.v2.nav.primaryNav')}
      data-testid="mobile-tab-bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-us-border/70 bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {items.map((item, i) => {
          const Icon = item.icon;
          const active = item.match(path);
          return (
            <li key={`${item.href}-${i}`} className="flex-1">
              <LocaleLink
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  // 56px tall: comfortably above the 44px touch-target floor
                  // without eating a screen the content needs.
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] leading-none transition-colors',
                  active ? 'text-[#16A34A]' : 'text-us-ink-muted hover:text-us-ink'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center',
                    item.primary
                      ? 'h-8 w-8 rounded-full bg-[#16A34A] text-white shadow-[0_4px_12px_-4px_rgba(22,163,74,0.6)]'
                      : ''
                  )}
                >
                  <Icon className={item.primary ? 'h-4 w-4' : 'h-5 w-5'} />
                </span>
                <span className="max-w-full truncate px-1">{item.label}</span>
              </LocaleLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
