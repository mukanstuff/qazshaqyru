'use client';

import { ArrowRight, Paintbrush, Sparkles } from 'lucide-react';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';

export function BlankCanvasCta({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <section
      className={
        'relative overflow-hidden rounded-3xl border border-us-border/70 bg-gradient-to-br from-white via-white to-us-accent-muted/30 px-6 py-8 shadow-us-sm sm:px-10 sm:py-10' +
        (className ? ` ${className}` : '')
      }
      data-testid="blank-canvas-cta"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-us-accent/12 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3 sm:max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-us-accent/30 bg-us-accent/8 px-3 py-1 font-body text-xs font-medium uppercase tracking-widest text-us-accent">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t('templatesPage.builderEyebrow')}
          </span>
          <h2 className="font-display text-2xl leading-tight text-us-ink sm:text-3xl">
            {t('templatesPage.builderTitle')}
          </h2>
          <p className="font-body text-sm leading-relaxed text-us-ink-muted sm:text-base">
            {t('templatesPage.builderBody')}
          </p>
        </div>

        <LocaleLink
          href="/admin/templates/builder?new=1"
          className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-us-cta px-5 py-3 font-body text-sm font-medium text-white shadow-us-sm transition-colors hover:bg-us-cta-hover sm:self-auto"
        >
          <Paintbrush className="h-4 w-4" aria-hidden />
          {t('templatesPage.builderCta')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </LocaleLink>
      </div>
    </section>
  );
}