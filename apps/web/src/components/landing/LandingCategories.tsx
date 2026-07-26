'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';
import {
  Cake,
  Gem,
  Heart,
  PartyPopper,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react';

import { useI18n } from '@/i18n';

const CATEGORIES: { key: string; slug: string; icon: LucideIcon }[] = [
  { key: 'wedding', slug: 'wedding', icon: Heart },
  { key: 'toy', slug: 'toy', icon: PartyPopper },
  { key: 'betashar', slug: 'betashar', icon: Gem },
  { key: 'kyzUzatu', slug: 'kyz-uzatu', icon: Sparkles },
  { key: 'sundetToy', slug: 'sundet-toy', icon: Sun },
  { key: 'birthday', slug: 'birthday', icon: Cake },
];

export function LandingCategories() {
  const { t } = useI18n();

  return (
    <section className="landing-section bg-white">
      <div className="us-container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="us-overline mb-4 text-[var(--us-sage)]">
            {t('landing.categories.overline')}
          </p>
          <h2 className="us-display-l text-[var(--us-forest)]">
            {t('landing.categories.title')}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ key, slug, icon: Icon }) => (
            <LocaleLink
              key={key}
              href={`/templates/${slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-[var(--us-sage)]/25 bg-[var(--us-cream)] p-5 transition-all hover:border-[var(--us-sage)] hover:shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--us-sage)]/15 text-[var(--us-forest)] transition-colors group-hover:bg-[var(--us-sage)]/25">
                <Icon size={22} strokeWidth={1.5} aria-hidden />
              </div>
              <div>
                <h3 className="font-display text-lg text-[var(--us-forest)]">
                  {t(`landing.categories.${key}Title`)}
                </h3>
                <p className="font-body text-sm text-[var(--us-forest)]/65">
                  {t(`landing.categories.${key}Desc`)}
                </p>
              </div>
            </LocaleLink>
          ))}
        </div>
      </div>
    </section>
  );
}
