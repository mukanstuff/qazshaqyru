'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { ExternalLink } from 'lucide-react';

import { useI18n } from '@/i18n';

export function LandingLiveDemo() {
  const { t } = useI18n();

  return (
    <section id="how" className="relative overflow-hidden py-20 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_srgb,var(--us-accent)_10%,transparent),transparent_50%)]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-[0.95fr_1.05fr] md:items-center">
        <div className="max-w-xl">
          <p className="us-overline mb-5">{t('landing.v2.liveDemo.overline')}</p>
          <h2 className="font-display text-3xl text-us-ink md:text-5xl">
            {t('landing.v2.liveDemo.title')}{' '}
            <span className="text-us-accent">{t('landing.v2.liveDemo.titleAccent')}</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-us-ink-muted md:text-base">
            {t('landing.v2.liveDemo.subtitle')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LocaleLink
              href="/i/demo?layout=wedding-luxury"
              className="inline-flex items-center gap-2 rounded-full bg-us-accent px-6 py-3 text-sm font-semibold text-us-cream transition-colors hover:bg-us-accent-strong"
            >
              {t('landing.v2.liveDemo.openDemo')} <ExternalLink className="h-4 w-4" />
            </LocaleLink>
            <a
              href="#pricing"
              className="us-glass-strong inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold text-us-accent transition-colors hover:border-us-accent"
            >
              {t('landing.v2.liveDemo.jumpPricing')}
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-4 rounded-[2.25rem] bg-us-accent/10 blur-2xl" aria-hidden />
          <div className="us-glass relative mx-auto max-w-[420px] rounded-[2rem] border p-4 shadow-[0_24px_60px_-24px_rgba(44,24,16,0.28)] md:p-5">
            <div className="us-glass-soft rounded-[1.6rem] border p-3 md:p-4">
              <div className="mb-3 flex items-center justify-between border-b border-us-accent/10 pb-3 text-xs text-us-ink-muted">
                <span>{t('landing.v2.liveDemo.frameLabel')}</span>
                <span className="rounded-full bg-us-accent/10 px-3 py-1 text-us-accent">
                  QazShaqyru
                </span>
              </div>
              <div className="overflow-hidden rounded-[1.2rem] border border-us-accent/10 bg-[#f8f2eb]">
                <iframe
                  src="/i/demo?layout=wedding-luxury&embed=1"
                  title={t('landing.v2.liveDemo.iframeTitle')}
                  className="h-[68vh] w-full max-h-[740px] min-h-[560px]"
                  loading="lazy"
                  sandbox="allow-forms allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
