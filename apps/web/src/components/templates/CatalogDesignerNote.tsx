'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { getWhatsappHref } from '@/lib/site/legal-config';

/**
 * Honest catalog note — no fake product cards.
 * Designer owns new rituals; agents only wire when assets exist.
 */
export function CatalogDesignerNote({ ritualHints }: { ritualHints: string[] }) {
  const { t, locale } = useI18n();
  const wa = getWhatsappHref(
    locale === 'kz'
      ? 'Сәлем! Қандай той шаблоны керек екенін жазыңыз.'
      : 'Здравствуйте! Напишите, какой шаблон тоя нужен.',
  );

  return (
    <section
      className="rounded-2xl border border-us-border bg-us-ivory/80 px-5 py-6 md:px-8 md:py-8"
      data-testid="catalog-designer-note"
    >
      <h2 className="font-display text-2xl text-us-ink">{t('templatesPage.designerNoteTitle')}</h2>
      <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-us-ink-muted">
        {t('templatesPage.roadmapNote')}
      </p>
      {ritualHints.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={t('templatesPage.designerPipeline')}>
          {ritualHints.map((label) => (
            <li
              key={label}
              className="rounded-full border border-us-border bg-us-cream px-3 py-1 font-body text-xs text-us-ink-muted"
            >
              {label}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <a href={wa} target="_blank" rel="noopener noreferrer">
            {t('templatesPage.waitlistCta')}
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/templates?managed=1">
            {locale === 'kz' ? 'Сіз үшін жинаймыз' : 'Сделаем за вас'}
          </Link>
        </Button>
      </div>
    </section>
  );
}
