'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { Play } from 'lucide-react';

import { useI18n } from '@/i18n';

import { LandingImage } from './LandingImage';

export function LandingVideoCTA() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <div className="relative aspect-[21/9] min-h-[240px] w-full sm:min-h-[320px]">
        <LandingImage
          name="video-banner"
          alt={t('landing.videoCta.imageAlt')}
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[var(--us-forest)]/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
          <LocaleLink
            href="/templates"
            className="group mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80 bg-white/10 backdrop-blur-sm transition-transform hover:scale-105"
            aria-label={t('landing.videoCta.playLabel')}
          >
            <Play size={28} className="ml-1 fill-white text-white" aria-hidden />
          </LocaleLink>
          <h2 className="us-display-l mb-3 max-w-xl text-balance">
            {t('landing.videoCta.title')}
          </h2>
          <p className="max-w-md font-body text-white/85">
            {t('landing.videoCta.subtitle')}
          </p>
        </div>
      </div>
    </section>
  );
}
