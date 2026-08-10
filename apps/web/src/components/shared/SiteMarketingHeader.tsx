'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, GraduationCap } from 'lucide-react';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher';
import { BrandMark } from '@/components/shared/BrandMark';

const NAV_PROBE_Y = 44;
const NAV_WIDTH_WIDE = 1400;
const NAV_WIDTH_COMPACT = 960;

type SiteMarketingHeaderProps = {
  isLoggedIn?: boolean;
};

export function SiteMarketingHeader({ isLoggedIn = false }: SiteMarketingHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t } = useI18n();
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

  const navLinks = [
    { href: '/', label: t('landing.nav.home') },
    { href: '/templates', label: t('landing.v2.nav.templates') },
    { href: '/pricing', label: t('landing.v2.nav.pricing') },
    { href: '/about', label: t('landing.nav.about') },
    { href: '/blog', label: t('site.footer.blog') },
    { href: '/faq', label: t('site.footer.faq') },
  ] as const;

  const navLightText = navOnDark && !navOverHero;
  const navCompact = !navOverHero;
  const navShellClass = navLightText
    ? 'us-chrome-pill--dark border shadow-lg'
    : 'us-chrome-pill border shadow-lg';
  const navCreateLabel = t('landing.nav.create');

  // Full nav at top, compact when scrolled
  const showFullNav = navOverHero;

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
          <LocaleLink
            href="/"
            className={`shrink-0 whitespace-nowrap transition-colors duration-300 ${
              navLightText ? 'text-white hover:text-white' : 'text-us-ink'
            }`}
          >
            <BrandMark size={navCompact ? 'sm' : 'md'} />
          </LocaleLink>

          {/* Full navigation at top of page */}
          <nav
            className={`hidden items-center justify-center transition-all duration-300 lg:flex ${
              navCompact ? 'gap-3' : 'gap-5'
            }`}
          >
            {navLinks.map(({ href, label }) => (
              <LocaleLink
                key={href}
                href={href}
                className={`shrink-0 whitespace-nowrap text-sm transition-colors duration-300 ${
                  navLightText
                    ? 'text-white/90 hover:text-white'
                    : 'text-us-ink-muted hover:text-[#16A34A]'
                }`}
              >
                {label}
              </LocaleLink>
            ))}
            
            {/* Courses link - new */}
            <LocaleLink
              href="/courses"
              className={`shrink-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-all duration-300 ${
                navLightText
                  ? 'border-white/30 text-white/90 hover:border-white/50 hover:bg-white/10'
                  : 'border-[#16A34A]/30 text-[#16A34A] hover:border-[#16A34A] hover:bg-[#16A34A]/5'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {t('landing.v2.nav.courses')}
            </LocaleLink>
          </nav>

          <div className={`flex shrink-0 items-center ${navCompact ? 'gap-1.5 md:gap-2' : 'gap-2 md:gap-3'}`}>
            <LanguageSwitcher compact inverted={navLightText} />
            <LocaleLink
              href={isLoggedIn ? '/dashboard' : '/login'}
              className={`hidden h-9 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-sm leading-none transition-colors duration-300 lg:flex ${
                navLightText
                  ? 'text-white/90 hover:text-white'
                  : 'text-us-ink-muted hover:text-[#16A34A]'
              }`}
            >
              {isLoggedIn ? t('nav.myInvites') : t('landing.nav.login')}
            </LocaleLink>
            <LocaleLink
              href="/create"
              className={`hidden h-9 shrink-0 items-center whitespace-nowrap rounded-full text-sm leading-none transition-all duration-300 lg:flex ${
                navCompact ? 'px-4' : 'px-5'
              } ${
                navLightText
                  ? 'bg-white text-[#16A34A] hover:bg-white/90'
                  : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
              }`}
            >
              {navCreateLabel}
            </LocaleLink>
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
                
                {/* Courses in mobile menu */}
                <LocaleLink
                  href="/courses"
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-[#16A34A] transition-colors hover:bg-[#16A34A]/5"
                  onClick={() => setMenuOpen(false)}
                >
                  <GraduationCap className="h-4 w-4" />
                  {t('landing.v2.nav.courses')}
                </LocaleLink>
              </div>
              
              <div className="mt-4 space-y-2 border-t border-black/5 pt-4">
                <LocaleLink
                  href={isLoggedIn ? '/dashboard' : '/login'}
                  className="block rounded-xl px-4 py-3 text-sm text-us-ink-muted transition-colors hover:bg-black/[0.03] hover:text-[#16A34A]"
                  onClick={() => setMenuOpen(false)}
                >
                  {isLoggedIn ? t('nav.myInvites') : t('landing.nav.login')}
                </LocaleLink>
                <LocaleLink
                  href="/create"
                  className="block rounded-full bg-[#16A34A] px-5 py-3 text-center text-sm text-white"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('landing.v2.nav.createInvitation')}
                </LocaleLink>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
