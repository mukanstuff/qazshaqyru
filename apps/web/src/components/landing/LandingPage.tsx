'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { SoftLocaleBanner } from '@/components/seo/SoftLocaleBanner';
import { SiteCompactFooter } from '@/components/shared/SiteCompactFooter';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { MobileTabBar } from '@/components/shared/MobileTabBar';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Phone } from 'lucide-react';

import { useI18n } from '@/i18n';
import { formatKztWithSign } from '@/lib/shared/format-price';
import type { CategoryCounts } from '@/lib/landing/category-counts';

import { LandingFaq } from './LandingFaq';
import { LandingReviews } from './LandingReviews';
import { LandingHeroShowcase } from './LandingHeroShowcase';
import { LandingCelebrations } from './LandingCelebrations';
import { LandingGrain } from './LandingGrain';
import { PricingTeaser } from './PricingTeaser';
import { LandingOpsChapter } from './LandingOpsChapter';
import { getPublicWhatsappNumber, getSupportMailto, getWhatsappHref } from '@/lib/site/legal-config';

type LandingPageProps = {
  /** Kept for callers; hero no longer shows vanity stats (D6 hero budget). */
  publishedInvitations?: number;
  isLoggedIn?: boolean;
  /**
   * Cheapest active template, in tenge, read from the catalogue.
   *
   * `null` means nothing is priced yet, and the hero falls back to the
   * qualitative promise rather than inventing a figure.
   */
  minTemplatePriceKzt?: number | null;
  /** Live template count per catalogue route, straight from the database. */
  categoryCounts?: CategoryCounts;
};

export function LandingPage({
  publishedInvitations: _publishedInvitations = 0,
  isLoggedIn = false,
  categoryCounts = {},
  // 2026-07-30 OWNER MODEL (docs/PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md + AUDIT_ISSUES.md):
  // Real value ALWAYS comes from DB (min active Template.priceKzt).
  // Null rather than a hardcoded fallback: a wrong price on the landing is
  // worse than no price, and the caller now always supplies the real one.
  minTemplatePriceKzt = null,
}: LandingPageProps) {
  void _publishedInvitations;
  const { t } = useI18n();
  // motion's own hook instead of reading matchMedia during render: that read
  // returned false on the server and possibly true on the client, which is a
  // hydration mismatch, and it never updated if the setting changed.
  const prefersReducedMotion = useReducedMotion() ?? false;

  const hasWhatsapp = Boolean(getPublicWhatsappNumber());
  const contactHref = hasWhatsapp ? getWhatsappHref() : getSupportMailto();

  return (
    <div className="landing-page relative min-h-screen bg-white font-body text-us-ink">
      <LandingGrain />
      <SoftLocaleBanner />
      <SiteHeader isLoggedIn={isLoggedIn} />

      <div className="overflow-x-clip">
        <section
          data-landing-hero
          className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-white pb-20 md:h-[100dvh] md:max-h-[100dvh] md:pb-12"
        >
          {/* Алатау glow — turquoise + peach */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 top-1/4 h-[520px] w-[520px] rounded-full bg-[#16A34A]/10 blur-[140px]" aria-hidden />
            <div className="absolute -right-40 bottom-1/4 h-[480px] w-[480px] rounded-full bg-[#BAE6FD]/15 blur-[120px]" aria-hidden />
            <div className="absolute left-1/3 top-1/2 h-[300px] w-[300px] rounded-full bg-[#F59E0B]/8 blur-[100px]" aria-hidden />
          </div>

          <div className="relative mx-auto grid w-full max-w-7xl flex-1 content-start items-start gap-6 px-5 pb-8 pt-[5.25rem] sm:gap-8 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:content-center md:items-center md:gap-8 md:px-8 md:pb-12 md:pt-[4.25rem] lg:gap-12 lg:px-12">
            <div className="order-1 flex min-h-0 flex-col justify-center">
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="landing-hero-readable max-w-2xl"
              >
                <p
                  className="landing-hero-brand font-display tracking-wide text-us-ink"
                  data-testid="landing-hero-brand"
                >
                  {t('landing.v2.hero.badge')}
                </p>

                <h1
                  className="mt-3 text-balance text-us-ink md:mt-5"
                  data-testid="landing-hero-title"
                >
                  {t('landing.v2.hero.titleLine1')}{' '}
                  <em className="landing-hero-accent not-italic text-[#16A34A]">
                    {t('landing.v2.hero.titleLine2')}
                  </em>
                </h1>

                <p
                  className="landing-hero-sub mt-4 max-w-lg md:mt-5 md:max-w-xl"
                  data-testid="landing-hero-subtitle"
                >
                  {t('landing.v2.hero.subtitle')}
                </p>

                <div
                  className="mt-6 flex flex-wrap gap-3 md:mt-7"
                  data-testid="landing-hero-ctas"
                >
                  <LocaleLink
                    href="/templates"
                    className="group flex min-h-12 items-center gap-2 rounded-full bg-[#16A34A] px-7 py-3.5 text-base font-medium text-white shadow-[0_8px_20px_-8px_rgba(22,163,74,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#15803D] hover:shadow-[0_12px_28px_-8px_rgba(22,163,74,0.6)] md:min-h-[3.25rem] md:px-8"
                  >
                    {t('landing.v2.hero.ctaPrimary')}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </LocaleLink>
                  {/*
                    The secondary CTA pointed at `/i/demo`, which defaults to
                    the `luxe-gold` layout — a slug that is not in the Template
                    table, so the route served the dead legacy fallback. Rather
                    than send people to a broken page (or duplicate the primary
                    CTA, which already goes to /templates), the hero now carries
                    one action and the pricing link below it.
                  */}
                  <LocaleLink
                    href="/pricing"
                    className="flex min-h-12 max-w-full items-center rounded-full border-2 border-[#16A34A]/30 bg-white px-6 py-3.5 text-base font-medium leading-snug text-[#1F3A2E] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#16A34A]/50 hover:bg-[#16A34A]/5 sm:px-7 md:min-h-[3.25rem]"
                  >
                    {t('landing.v2.nav.pricing')}
                  </LocaleLink>
                </div>

                {/* Reassurance line, not navigation — it used to be wrapped in
                    a link to /pricing, which the secondary CTA above now is. */}
                {/*
                  The price is stated as a number, taken from the catalogue.
                  Both reference services put a concrete figure in the first
                  screen; ours only promised "pay when you like it", which reads
                  well but sends the visitor hunting for the cost. The number is
                  read live so it can never contradict the catalogue, and the
                  line falls back to the qualitative promise when nothing is
                  priced yet.
                */}
                <p className="mt-4 text-sm text-us-ink-muted">
                  {minTemplatePriceKzt
                    ? t('landing.v2.hero.priceFromValue', {
                        price: formatKztWithSign(minTemplatePriceKzt),
                      })
                    : t('landing.v2.hero.priceFrom')}
                </p>

                <ul
                  className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2"
                  data-testid="landing-hero-trust"
                >
                  {(['trust1', 'trust2', 'trust3'] as const).map((key) => (
                    <li
                      key={key}
                      className="flex items-center gap-2 text-sm text-us-ink-muted"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden />
                      <span>{t(`landing.v2.hero.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <div className="order-2 flex min-h-0 items-start justify-center overflow-visible pt-2 md:items-center md:pt-0">
              <LandingHeroShowcase prefersReducedMotion={prefersReducedMotion} />
            </div>
          </div>
        </section>

        <LandingOpsChapter />

        <section id="templates" className="relative overflow-hidden border-t border-[#16A34A]/10 bg-gradient-to-b from-white to-[#FFFBEB] py-24">
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="us-overline mb-5">{t('landing.v2.celebrations.overline')}</p>
              <h2 className="mb-3 font-display text-4xl text-[#1F3A2E] md:text-5xl">
                {t('landing.v2.templates.title')}
              </h2>
              <p className="text-sm text-[#6B8A92]">{t('landing.v2.templates.subtitle')}</p>
            </div>

            <LandingCelebrations embedded categoryCounts={categoryCounts} />
          </div>
        </section>

        <section id="pricing" className="relative overflow-hidden bg-gradient-to-b from-[#FFFBEB] to-white py-20 md:py-24">
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <p className="us-overline mb-5">{t('landing.v2.pricing.overline')}</p>
              <h2 className="font-display text-4xl text-[#1F3A2E] md:text-5xl">
                {t('landing.v2.pricing.title')}{' '}
                <span className="text-[#16A34A]">{t('landing.v2.pricing.titleAccent')}</span>
              </h2>
            </div>

            {/* The teaser wants a concrete number; when nothing is priced yet
                it keeps its own long-standing default rather than rendering a
                blank. Only the hero line degrades to the qualitative promise. */}
            <PricingTeaser minTemplatePriceKzt={minTemplatePriceKzt ?? 3_990} />
          </div>
        </section>

        <LandingReviews />
        <LandingFaq />

        <section data-nav-theme="dark" className="relative overflow-hidden bg-gradient-to-br from-[#1F3A2E] via-[#0EA5E9] to-[#16A34A] py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 top-1/4 h-[400px] w-[400px] rounded-full bg-[#F59E0B]/15 blur-[120px]" aria-hidden />
            <div className="absolute -right-20 bottom-1/4 h-[350px] w-[350px] rounded-full bg-[#BAE6FD]/12 blur-[100px]" aria-hidden />
          </div>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <h2 className="mb-6 font-display text-5xl leading-[1.08] text-white md:text-[3.8rem]">
              {t('landing.v2.cta.titleLine1')}
              <br />
              {t('landing.v2.cta.titleLine2')}
            </h2>
            <p className="mx-auto mb-10 max-w-sm text-lg leading-relaxed text-white/90">
              {t('landing.v2.cta.subtitle')}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <LocaleLink
                href="/templates"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-9 py-4 text-base font-medium text-[#1F3A2E] transition-all hover:-translate-y-0.5 hover:bg-[#FAFBFC] hover:shadow-lg"
              >
                {t('landing.v2.cta.primary')} <ArrowRight className="h-5 w-5" />
              </LocaleLink>
              <a
                href={contactHref}
                target={hasWhatsapp ? '_blank' : undefined}
                rel={hasWhatsapp ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-white/30 bg-white/10 px-9 py-4 text-base font-medium text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20"
              >
                <Phone className="h-4 w-4 text-white" />
                {hasWhatsapp ? t('landing.v2.cta.whatsapp') : t('site.contacts.email')}
              </a>
            </div>
            <p className="mt-6 text-sm text-white/85">{t('landing.v2.cta.disclaimer')}</p>
          </div>
        </section>

        <SiteCompactFooter />
        {/* Height reserved so the footer clears the fixed bar. */}
        <div className="h-14 md:hidden" aria-hidden />
        <MobileTabBar isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
