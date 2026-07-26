'use client';

import { useI18n } from '@/i18n';

const STEP_KEYS = ['choose', 'customize', 'share'] as const;

export function LandingSteps() {
  const { t } = useI18n();

  return (
    <section className="landing-section">
      <div className="us-container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="us-overline mb-4 text-[var(--us-sage)]">
            {t('landing.steps.overline')}
          </p>
          <h2 className="us-display-l text-[var(--us-forest)]">
            {t('landing.steps.title')}
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {STEP_KEYS.map((key, index) => (
            <article key={key} className="relative text-center">
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--us-sage)]/40 font-display text-xl text-[var(--us-forest)]">
                {index + 1}
              </span>
              <h3 className="mb-3 font-display text-xl text-[var(--us-forest)]">
                {t(`landing.steps.${key}Title`)}
              </h3>
              <p className="font-body text-sm leading-relaxed text-[var(--us-forest)]/70">
                {t(`landing.steps.${key}Desc`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
