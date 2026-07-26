'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { internalToSeoPath } from '@/lib/seo/hreflang';
import { pathnameForSeoLocale } from '@/lib/seo/locale-path';

const NAV_PROBE_Y = 44;
const NAV_WIDTH_WIDE = 920;
const NAV_WIDTH_COMPACT = 800;

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

  const switchLocale = (next: 'ru' | 'kz') => {
    setLocale(next);
    const nextPath = pathnameForSeoLocale(pathname || '/', internalToSeoPath(next));
    router.push(nextPath);
  };

  const navLinks = [
    { href: '/templates', label: t('landing.v2.nav.templates') },
    { href: '/pricing', label: t('landing.v2.nav.pricing') },
    { href: '/blog', label: t('site.footer.blog') },
    { href: '/faq', label: t('site.footer.faq') },
  ] as const;

  const navLightText = navOnDark && !navOverHero;
  const navCompact = !navOverHero;
  const navShellClass = navLightText
    ? 'us-chrome-pill--dark border shadow-lg'
    : 'us-chrome-pill border shadow-lg';
  const navCreateLabel = navCompact
    ? t('landing.v2.nav.createShort')
    : t('landing.v2.nav.create');

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
        style={{ maxWidth: navOverHero ? NAV_WIDTH_WIDE : NAV_WIDTH_COMPACT }}
      >
        <div
          className={`flex h-12 items-center justify-between gap-3 rounded-full border px-4 transition-[background-color,border-color,box-shadow,padding] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:h-14 ${
            navCompact ? 'md:gap-4 md:px-5' : 'md:px-6'
          } ${navShellClass}`}
        >
          <LocaleLink
            href="/"
            className={`shrink-0 whitespace-nowrap font-display tracking-wide transition-colors duration-300 ${
              navCompact ? 'text-base md:text-lg' : 'text-lg md:text-xl'
            } ${navLightText ? 'text-white hover:text-white' : 'text-us-ink'}`}
          >
            QazShaqyru
          </LocaleLink>

          <nav
            className={`hidden min-w-0 flex-1 items-center justify-center md:flex ${
              navCompact ? 'gap-4' : 'gap-6'
            }`}
          >
            {navLinks.map(({ href, label }) => (
              <LocaleLink
                key={href}
                href={href}
                className={`shrink-0 whitespace-nowrap text-sm transition-colors duration-300 ${
                  navLightText
                    ? 'text-white/90 hover:text-white'
                    : 'text-us-ink-muted hover:text-us-accent'
                }`}
              >
                {label}
              </LocaleLink>
            ))}
          </nav>

          <div className={`flex shrink-0 items-center ${navCompact ? 'gap-1.5 md:gap-2' : 'gap-2 md:gap-3'}`}>
            <button
              type="button"
              onClick={() => switchLocale(locale === 'ru' ? 'kz' : 'ru')}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[11px] leading-none tracking-[0.12em] transition-all duration-300 ${
                navLightText
                  ? 'border-white/40 text-white hover:border-white hover:bg-white/10'
                  : 'border-us-accent/20 text-us-ink-muted hover:border-us-accent/50 hover:text-us-accent'
              }`}
              aria-label="Language"
            >
              {locale === 'ru' ? 'KZ' : 'RU'}
            </button>
            <LocaleLink
              href={isLoggedIn ? '/dashboard' : '/login'}
              className={`hidden h-9 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-sm leading-none transition-colors duration-300 sm:flex ${
                navLightText
                  ? 'text-white/90 hover:text-white'
                  : 'text-us-ink-muted hover:text-us-accent'
              }`}
            >
              {isLoggedIn ? t('nav.myInvites') : t('landing.nav.login')}
            </LocaleLink>
            <LocaleLink
              href="/invitations/edit"
              className={`hidden h-9 shrink-0 items-center whitespace-nowrap rounded-full text-sm leading-none transition-colors duration-300 md:flex ${
                navCompact ? 'px-4' : 'px-5'
              } ${
                navLightText
                  ? 'bg-white text-us-accent hover:bg-white/90'
                  : 'bg-us-accent text-us-cream hover:bg-us-accent-strong'
              }`}
            >
              {navCreateLabel}
            </LocaleLink>
            <button
              type="button"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full md:hidden ${
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
              className="absolute inset-x-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden"
            >
              {navLinks.map(({ href, label }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <LocaleLink
                    href={href}
                    className="block rounded-xl px-4 py-3 text-sm text-us-ink-muted transition-colors hover:bg-black/[0.03] hover:text-us-accent"
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </LocaleLink>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.05, duration: 0.2 }}
                className="mt-1 space-y-1 px-1"
              >
                <LocaleLink
                  href={isLoggedIn ? '/dashboard' : '/login'}
                  className="block rounded-xl px-4 py-3 text-sm text-us-ink-muted transition-colors hover:bg-black/[0.03] hover:text-us-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  {isLoggedIn ? t('nav.myInvites') : t('landing.nav.login')}
                </LocaleLink>
                <LocaleLink
                  href="/invitations/edit"
                  className="block rounded-full bg-us-accent px-5 py-3 text-center text-sm text-us-cream"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('landing.v2.nav.createInvitation')}
                </LocaleLink>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
