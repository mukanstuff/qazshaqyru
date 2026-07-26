'use client';

import { useI18n } from '@/i18n';

import { LandingImage } from './LandingImage';

export function LandingAbout() {
  const { t } = useI18n();

  return (
    <section className="landing-section bg-white">
      <div className="us-container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative flex justify-center gap-6">
            <LandingImage
              name="floral-left"
              alt=""
              width={200}
              height={600}
              aria-hidden
              className="absolute -left-4 top-0 hidden w-12 opacity-50 lg:block"
            />
            <div className="overflow-hidden rounded-full">
              <LandingImage
                name="about-1"
                alt={t('landing.about.image1Alt')}
                width={400}
                height={400}
                className="h-48 w-48 object-cover sm:h-56 sm:w-56"
              />
            </div>
            <div className="-mt-8 overflow-hidden rounded-full">
              <LandingImage
                name="about-2"
                alt={t('landing.about.image2Alt')}
                width={400}
                height={400}
                className="h-44 w-44 object-cover sm:h-52 sm:w-52"
              />
            </div>
          </div>

          <div>
            <p className="us-overline mb-4 text-[var(--us-sage)]">
              {t('landing.about.overline')}
            </p>
            <h2 className="us-display-l mb-6 text-[var(--us-forest)]">
              {t('landing.about.title')}
            </h2>
            <div className="landing-hairline mb-6" />
            <p className="mb-4 font-body leading-relaxed text-[var(--us-forest)]/75">
              {t('landing.about.p1')}
            </p>
            <p className="font-body leading-relaxed text-[var(--us-forest)]/75">
              {t('landing.about.p2')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
