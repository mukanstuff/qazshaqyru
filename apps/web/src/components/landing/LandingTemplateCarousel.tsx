'use client';

import Image from 'next/image';
import { LocaleLink } from '@/components/seo/LocaleLink';
import { ArrowRight } from 'lucide-react';

import { useI18n } from '@/i18n';
import { LANDING_TOY_PHOTOS } from '@/lib/landing/assets';
import { CATALOG_TEMPLATE_SLUGS } from '@/lib/templates/catalog';
import { getTemplatePreviewUrl } from '@/lib/templates';

const TEMPLATE_LABEL_KEYS: Record<string, 'weddingLuxury'> = {
  'wedding-luxury': 'weddingLuxury',
};

const COMING_SOON_TEMPLATES = [
  { key: 'comingSoonToy' as const, image: LANDING_TOY_PHOTOS.hallBlue },
  { key: 'comingSoonBetashar' as const, image: LANDING_TOY_PHOTOS.danceHall },
];

export function LandingTemplateCarousel() {
  const { t } = useI18n();

  return (
    <div className="relative">
      <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2 snap-x snap-mandatory scrollbar-thin md:justify-center md:overflow-visible">
        {CATALOG_TEMPLATE_SLUGS.map((slug) => {
          const previewSrc = getTemplatePreviewUrl(slug);
          const labelKey = TEMPLATE_LABEL_KEYS[slug];
          const label = labelKey ? t(`landing.v2.templates.${labelKey}`) : slug;

          return (
            <LocaleLink
              key={slug}
              href={`/i/demo?layout=${slug}`}
              className="group w-[min(72vw,220px)] flex-shrink-0 snap-center md:w-[220px]"
            >
              <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/15 bg-us-ink/20 shadow-xl transition-transform group-hover:scale-[1.02]">
                {previewSrc ? (
                  <Image
                    src={previewSrc}
                    alt={label}
                    fill
                    className="object-cover"
                    sizes="220px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/50">
                    —
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-us-ink/80 to-transparent p-4 pt-10">
                  <p className="font-display text-lg text-us-cream">{label}</p>
                  <p className="mt-1 flex items-center gap-1 font-body text-xs text-white/70">
                    {t('landing.v2.templates.previewDemo')}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </div>
            </LocaleLink>
          );
        })}

        {COMING_SOON_TEMPLATES.map(({ key, image }) => (
          <div
            key={key}
            className="relative w-[min(72vw,220px)] flex-shrink-0 snap-center md:w-[220px]"
          >
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-us-ink/30 shadow-xl">
              <Image
                src={image}
                alt=""
                fill
                className="object-cover blur-sm brightness-75"
                sizes="220px"
              />
              <div className="absolute inset-0 bg-us-ink/35" />
              <div className="absolute inset-x-0 top-4 flex justify-center">
                <span className="rounded-full bg-us-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                  {t('landing.v2.templates.comingSoon')}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-us-ink/90 to-transparent p-4 pt-10">
                <p className="font-display text-lg text-us-cream">{t(`landing.v2.templates.${key}`)}</p>
              </div>
            </div>
          </div>
        ))}

        <LocaleLink
          href="/templates"
          className="flex w-[min(72vw,220px)] flex-shrink-0 snap-center flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/5 px-6 py-8 text-center transition-colors hover:border-white/40 hover:bg-white/10 md:w-[220px]"
        >
          <span className="mb-2 font-display text-lg text-us-cream">
            {t('landing.v2.templates.viewAll')}
          </span>
          <ArrowRight className="h-5 w-5 text-us-gold" />
        </LocaleLink>
      </div>
    </div>
  );
}
