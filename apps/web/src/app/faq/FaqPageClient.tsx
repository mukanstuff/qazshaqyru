'use client';

import { useState } from 'react';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { ChevronDown, ArrowRight } from 'lucide-react';

import { PublicShell } from '@/components/shared/PublicShell';
import { useI18n } from '@/i18n';
import { FAQ_KEYS } from '@/lib/site/faq-keys';
import { cn } from '@/lib/shared/utils';

export function FaqPageClient({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const { t } = useI18n();
  const [openKey, setOpenKey] = useState<string | null>(FAQ_KEYS[0] ?? null);

  return (
    <PublicShell isLoggedIn={isLoggedIn}>
      <section className="mx-auto max-w-2xl px-6 py-14 md:py-20">
        <p className="us-overline">{t('site.faq.overline')}</p>
        <h1 className="mt-3 font-display text-4xl text-us-ink md:text-5xl">
          {t('site.faq.title')}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-us-ink-muted">
          {t('site.faq.subtitle')}
        </p>

        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-white shadow-[0_12px_36px_-24px_rgba(44,24,16,0.3)]">
          <div className="divide-y divide-black/[0.06]">
            {FAQ_KEYS.map((key) => {
              const isOpen = openKey === key;
              return (
                <div key={key} className="px-5 sm:px-7">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-lg text-us-ink">
                      {t(`landing.faq.${key}Question`)}
                    </span>
                    <ChevronDown
                      size={20}
                      className={cn(
                        'shrink-0 text-us-ink-muted transition-transform',
                        isOpen && 'rotate-180'
                      )}
                      aria-hidden
                    />
                  </button>
                  {isOpen ? (
                    <p className="pb-5 text-sm leading-relaxed text-us-ink-muted">
                      {t(`landing.faq.${key}Answer`)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <LocaleLink
            href="/create"
            className="inline-flex items-center gap-2 rounded-full bg-us-accent px-6 py-3 text-sm font-medium text-us-cream transition-colors hover:bg-us-accent-strong"
          >
            {t('landing.v2.nav.create')}
            <ArrowRight className="h-4 w-4" />
          </LocaleLink>
          <LocaleLink
            href="/contacts"
            className="inline-flex items-center rounded-full border border-us-accent/25 bg-white px-6 py-3 text-sm font-medium text-us-ink transition-colors hover:border-us-accent/45"
          >
            {t('site.footer.contacts')}
          </LocaleLink>
        </div>
      </section>
    </PublicShell>
  );
}
