'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { PublicShell } from '@/components/shared/PublicShell';
import { useI18n } from '@/i18n';

export function AboutPageClient({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const { t } = useI18n();

  return (
    <PublicShell isLoggedIn={isLoggedIn}>
      <section className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        <p className="us-overline">{t('site.about.overline')}</p>
        <h1 className="mt-3 font-display text-4xl text-us-ink md:text-5xl">
          {t('site.about.title')}
        </h1>

        <div className="mt-10 space-y-5 rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-[0_12px_36px_-24px_rgba(44,24,16,0.3)] md:p-8">
          <p className="text-base leading-relaxed text-us-ink-muted">{t('site.about.p1')}</p>
          <p className="text-base leading-relaxed text-us-ink-muted">{t('site.about.p2')}</p>
          <p className="text-base leading-relaxed text-us-ink-muted">{t('site.about.p3')}</p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-full bg-us-accent px-6 py-3 text-sm font-medium text-us-cream transition-colors hover:bg-us-accent-strong"
          >
            {t('landing.v2.nav.create')}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/templates"
            className="inline-flex items-center rounded-full border border-us-accent/25 bg-white px-6 py-3 text-sm font-medium text-us-ink transition-colors hover:border-us-accent/45"
          >
            {t('landing.v2.nav.templates')}
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
