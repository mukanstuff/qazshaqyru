'use client';

import Image from 'next/image';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { ArrowRight } from 'lucide-react';

import { useI18n } from '@/i18n';
import { CATALOG_TEMPLATE_SLUG } from '@/lib/templates/catalog';
import { getWhatsappHref } from '@/lib/site/legal-config';

const WEDDING_LUXURY_PREVIEW = '/assets/templates/wedding-luxury/preview.jpg';

/**
 * Honest landing showroom: only live templates.
 * No coming-soon product slots — designer adds rituals, agents wire.
 */
export function LandingTemplateShowroom() {
  const { t, locale } = useI18n();
  const slug = CATALOG_TEMPLATE_SLUG;
  const wa = getWhatsappHref(
    locale === 'kz'
      ? 'Сәлем! Қандай той шаблоны керек екенін жазыңыз.'
      : 'Здравствуйте! Напишите, какой шаблон тоя нужен следующим.',
  );

  return (
    <div className="relative" data-testid="landing-template-showroom">
      <div className="relative mx-auto flex max-w-4xl flex-col items-center">
        <LocaleLink href={`/i/demo?layout=${slug}`} className="group relative block w-[min(100%,240px)]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[1.75rem] border border-white/20 bg-us-ink/30 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:-translate-y-1">
            <Image
              src={WEDDING_LUXURY_PREVIEW}
              alt={t('landing.v2.templates.weddingLuxury')}
              fill
              className="object-cover"
              sizes="240px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-us-ink/85 to-transparent p-5 pt-16">
              <p className="font-display text-xl text-us-cream">
                {t('landing.v2.templates.weddingLuxury')}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/75">
                {t('landing.v2.templates.previewDemo')}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </div>
        </LocaleLink>

        <p className="mt-8 max-w-md text-center text-sm leading-relaxed text-white/75">
          {t('landing.v2.templates.tabDescClassic')}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <LocaleLink
            href={`/i/demo?layout=${slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
          >
            {t('landing.v2.templates.previewDemo')}
            <ArrowRight className="h-4 w-4" />
          </LocaleLink>
          <LocaleLink
            href={`/invitations/edit?template=${slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-us-cream px-6 py-2.5 text-sm font-semibold text-us-accent transition-colors hover:bg-white"
          >
            {t('landing.v2.templates.createCta')}
          </LocaleLink>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-2.5 text-sm text-white/85 transition-colors hover:bg-white/10"
          >
            {t('landing.v2.templates.waitlistCta')}
          </a>
        </div>

        <p className="mt-6 max-w-lg text-center text-xs leading-relaxed text-white/50">
          {t('templatesPage.roadmapNote')}
        </p>
      </div>
    </div>
  );
}
