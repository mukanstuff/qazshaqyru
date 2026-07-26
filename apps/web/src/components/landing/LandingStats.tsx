'use client';

import { useI18n } from '@/i18n';

const STAT_KEYS = ['events', 'templates', 'guests', 'price'] as const;

export function LandingStats() {
  const { t } = useI18n();

  return (
    <section className="border-y border-[var(--us-sage)]/20 bg-[var(--us-forest)] py-12 text-white">
      <div className="us-container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STAT_KEYS.map((key) => (
            <div key={key} className="text-center">
              <p className="font-display text-3xl font-medium sm:text-4xl">
                {t(`landing.stats.${key}Value`)}
              </p>
              <p className="mt-2 font-body text-sm text-white/70">
                {t(`landing.stats.${key}Label`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
