'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';

import { useI18n } from '@/i18n';

import { LandingImage } from './LandingImage';

const BLOG_KEYS = ['one', 'two', 'three'] as const;
const BLOG_IMAGES = ['blog-1', 'blog-2', 'blog-3'] as const;

export function LandingBlogTeaser() {
  const { t } = useI18n();

  return (
    <section className="landing-section">
      <div className="us-container">
        <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="us-overline mb-4 text-[var(--us-sage)]">
              {t('landing.blogTeaser.overline')}
            </p>
            <h2 className="us-display-l text-[var(--us-forest)]">
              {t('landing.blogTeaser.title')}
            </h2>
          </div>
          <LocaleLink
            href="/blog"
            className="font-body text-sm font-medium text-[var(--us-sage)] underline-offset-4 hover:text-[var(--us-forest)] hover:underline"
          >
            {t('landing.blogTeaser.viewAll')}
          </LocaleLink>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_KEYS.map((key, index) => (
            <LocaleLink
              key={key}
              href="/blog"
              className="group overflow-hidden rounded-2xl border border-[var(--us-sage)]/20 bg-white transition-shadow hover:shadow-md"
            >
              <div className="aspect-[3/2] overflow-hidden">
                <LandingImage
                  name={BLOG_IMAGES[index]!}
                  alt={t(`landing.blogTeaser.${key}Title`)}
                  width={600}
                  height={400}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="mb-2 font-body text-xs uppercase tracking-wider text-[var(--us-sage)]">
                  {t(`landing.blogTeaser.${key}Category`)}
                </p>
                <h3 className="font-display text-lg text-[var(--us-forest)] group-hover:text-[var(--us-sage)]">
                  {t(`landing.blogTeaser.${key}Title`)}
                </h3>
              </div>
            </LocaleLink>
          ))}
        </div>
      </div>
    </section>
  );
}
