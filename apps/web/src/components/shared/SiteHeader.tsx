'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Menu, Settings, X } from 'lucide-react';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { BrandMark } from '@/components/shared/BrandMark';

/**
 * The site's ONE header.
 *
 * There used to be two: `SiteMarketingHeader` (landing + public pages) and
 * `AppHeader` (dashboard, invitation hub, seating, settings, admin). They had
 * different nav links, different chrome, and different logo targets, so
 * crossing from /templates into /dashboard visibly swapped the header — and
 * the app one sent the logo to /dashboard instead of the site root, which is
 * not what a logo does anywhere on the web.
 *
 * Everything is one component now. The signed-in surfaces just pass the extra
 * context they need (`backHref`, `title`, `action`, `variant="admin"`).
 */

const NAV_PROBE_Y = 44;
const NAV_WIDTH_WIDE = 1400;
const NAV_WIDTH_COMPACT = 960;

export type SiteHeaderProps = {
  /** Renders the account cluster (settings + logout) instead of «Войти». */
  isLoggedIn?: boolean;
  /**
   * Detail pages (one invitation, a seating plan) pass this to get an explicit
   * way back to the list they came from. Without it those pages are a dead end
   * apart from the browser's back button.
   */
  backHref?: string;
  backLabel?: string;
  /** Short context line shown next to the brand on detail pages. */
  title?: string;
  /** Page-specific control rendered at the right edge (e.g. a primary action). */
  action?: React.ReactNode;
  /** `admin` drops the public nav and stamps an Admin badge next to the logo. */
  variant?: 'default' | 'admin';
};

export function SiteHeader({
  isLoggedIn = false,
  backHref,
  backLabel,
  title,
  action,
  variant = 'default',
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOverHero, setNavOverHero] = useState(true);
  const [navOnDark, setNavOnDark] = useState(false);

  useLayoutEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const hero = document.querySelector<HTMLElement>('[data-landing-hero]');
      setNavOverHero(hero ? hero.getBoundingClientRect().bottom > NAV_PROBE_Y : false);

      let onDark = false;
      document.querySelectorAll('[data-nav-theme="dark"]').forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= NAV_PROBE_Y && rect.bottom > NAV_PROBE_Y) {
          onDark = true;
        }
      });
      setNavOnDark(onDark);
    };

    const scheduleMeasure = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleMeasure);
    document.addEventListener('scroll', scheduleMeasure, { passive: true, capture: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      document.removeEventListener('scroll', scheduleMeasure, { capture: true });
    };
  }, [pathname]);

  // Close the mobile sheet on navigation — it used to stay open across route
  // changes, covering the page you just navigated to.
  useLayoutEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const publicNav = [
    { href: '/', label: t('landing.nav.home') },
    { href: '/templates', label: t('landing.v2.nav.templates') },
    { href: '/pricing', label: t('landing.v2.nav.pricing') },
    { href: '/about', label: t('landing.nav.about') },
    { href: '/blog', label: t('site.footer.blog') },
    { href: '/faq', label: t('site.footer.faq') },
  ] as const;

  const signedInNav = [
    { href: '/dashboard', label: t('nav.invitations') },
    { href: '/templates', label: t('landing.v2.nav.templates') },
    { href: '/pricing', label: t('landing.v2.nav.pricing') },
    { href: '/faq', label: t('site.footer.faq') },
  ] as const;

  const navLinks =
    variant === 'admin' ? [] : isLoggedIn ? signedInNav : publicNav;

  const navLightText = navOnDark && !navOverHero;
  const navCompact = !navOverHero;
  const navShellClass = navLightText
    ? 'us-chrome-pill--dark border shadow-lg'
    : 'us-chrome-pill border shadow-lg';
  const showFullNav = navOverHero;

  const linkClass = (active: boolean) =>
    [
      'shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-sm transition-colors duration-300',
      navLightText
        ? active
          ? 'bg-white/15 text-white'
          : 'text-white/90 hover:text-white'
        : active
          ? 'bg-[#16A34A]/10 text-[#16A34A]'
          : 'text-us-ink-muted hover:text-[#16A34A]',
    ].join(' ');

  const isActiveHref = (href: string) =>
    href === '/' || href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <header
      data-landing-nav
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-4"
    >
      <div
        data-landing-nav
        data-nav-over-hero={navOverHero ? 'true' : 'false'}
        data-nav-on-dark={navOnDark ? 'true' : 'false'}
        data-nav-compact={navCompact ? 'true' : 'false'}
        className="pointer-events-auto relative w-full transition-[max-width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ maxWidth: showFullNav ? NAV_WIDTH_WIDE : NAV_WIDTH_COMPACT }}
      >
        <div
          className={`flex items-center justify-between gap-3 rounded-3xl border px-4 py-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:gap-4 ${
            navCompact ? 'md:px-5' : 'md:px-6'
          } ${navShellClass}`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {backHref ? (
              <LocaleLink
                href={backHref}
                title={backLabel ?? t('common.back')}
                aria-label={backLabel ?? t('common.back')}
                className={`-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  navLightText
                    ? 'text-white/90 hover:bg-white/10 hover:text-white'
                    : 'text-us-ink-muted hover:bg-[#16A34A]/8 hover:text-[#16A34A]'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
              </LocaleLink>
            ) : null}

            {/* The logo always goes to the site root — on every surface,
                signed in or not. */}
            <LocaleLink
              href="/"
              className={`shrink-0 whitespace-nowrap transition-colors duration-300 ${
                navLightText ? 'text-white hover:text-white' : 'text-us-ink'
              }`}
            >
              <BrandMark size={navCompact ? 'sm' : 'md'} />
            </LocaleLink>

            {variant === 'admin' ? (
              <span className="shrink-0 rounded-full bg-[#16A34A]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#16A34A]">
                Admin
              </span>
            ) : null}

            {title ? (
              <>
                <span className="hidden shrink-0 text-us-ink-muted/50 sm:inline" aria-hidden>
                  /
                </span>
                <span
                  className={`hidden min-w-0 truncate text-sm sm:inline ${
                    navLightText ? 'text-white/80' : 'text-us-ink-muted'
                  }`}
                >
                  {title}
                </span>
              </>
            ) : null}
          </div>

          {navLinks.length > 0 ? (
            <nav
              className={`hidden items-center justify-center transition-all duration-300 lg:flex ${
                navCompact ? 'gap-1.5' : 'gap-3'
              }`}
            >
              {navLinks.map(({ href, label }) => (
                <LocaleLink key={href} href={href} className={linkClass(isActiveHref(href))}>
                  {label}
                </LocaleLink>
              ))}
            </nav>
          ) : null}

          <div
            className={`flex shrink-0 items-center ${navCompact ? 'gap-1.5 md:gap-2' : 'gap-2 md:gap-3'}`}
          >
            {action}
            <LanguageSwitcher compact inverted={navLightText} />

            {isLoggedIn ? (
              <div className="hidden items-center gap-1 lg:flex">
                <LocaleLink
                  href="/settings"
                  title={t('settings.title')}
                  aria-label={t('settings.title')}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    navLightText
                      ? 'text-white/90 hover:bg-white/10 hover:text-white'
                      : 'text-us-ink-muted hover:bg-[#16A34A]/8 hover:text-[#16A34A]'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                </LocaleLink>
                <LogoutButton />
              </div>
            ) : (
              <LocaleLink
                href="/login"
                className={`hidden h-9 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-sm leading-none transition-colors duration-300 lg:flex ${
                  navLightText
                    ? 'text-white/90 hover:text-white'
                    : 'text-us-ink-muted hover:text-[#16A34A]'
                }`}
              >
                {t('landing.nav.login')}
              </LocaleLink>
            )}

            {variant === 'admin' ? null : (
              <LocaleLink
                href="/templates"
                className={`hidden h-9 shrink-0 items-center whitespace-nowrap rounded-full text-sm leading-none transition-all duration-300 lg:flex ${
                  navCompact ? 'px-4' : 'px-5'
                } ${
                  navLightText
                    ? 'bg-white text-[#16A34A] hover:bg-white/90'
                    : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                }`}
              >
                {t('landing.nav.create')}
              </LocaleLink>
            )}

            <button
              type="button"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full lg:hidden ${
                navLightText ? 'text-white' : 'text-us-ink'
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t('landing.v2.menuClose') : t('landing.v2.menuOpen')}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-3xl border border-black/[0.08] bg-white/95 p-4 shadow-xl backdrop-blur-xl lg:hidden"
            >
              {navLinks.length > 0 ? (
                <div className="space-y-1">
                  {navLinks.map(({ href, label }) => (
                    <LocaleLink
                      key={href}
                      href={href}
                      className="block rounded-xl px-4 py-3 text-sm text-us-ink-muted transition-colors hover:bg-black/[0.03] hover:text-[#16A34A]"
                      onClick={() => setMenuOpen(false)}
                    >
                      {label}
                    </LocaleLink>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 space-y-2 border-t border-black/5 pt-4">
                {isLoggedIn ? (
                  <>
                    <LocaleLink
                      href="/settings"
                      className="block rounded-xl px-4 py-3 text-sm text-us-ink-muted transition-colors hover:bg-black/[0.03] hover:text-[#16A34A]"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t('settings.title')}
                    </LocaleLink>
                    <div className="px-4">
                      <LogoutButton />
                    </div>
                  </>
                ) : (
                  <LocaleLink
                    href="/login"
                    className="block rounded-xl px-4 py-3 text-sm text-us-ink-muted transition-colors hover:bg-black/[0.03] hover:text-[#16A34A]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('landing.nav.login')}
                  </LocaleLink>
                )}
                {variant === 'admin' ? null : (
                  <LocaleLink
                    href="/templates"
                    className="block rounded-full bg-[#16A34A] px-5 py-3 text-center text-sm text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('landing.v2.nav.createInvitation')}
                  </LocaleLink>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
