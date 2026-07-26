'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { useI18n } from '@/i18n';
import { FAQ_KEYS } from '@/lib/site/faq-keys';
import { cn } from '@/lib/shared/utils';

export function LandingFaq() {
  const { t } = useI18n();
  const [openKey, setOpenKey] = useState<string | null>(FAQ_KEYS[0] ?? null);

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
      <div className="us-container">
        <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-black/[0.06] bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10">
          <p className="us-overline mb-4 text-center text-[var(--us-sage)]">
            {t('landing.faq.overline')}
          </p>
          <h2 className="us-display-l mb-10 text-center text-[var(--us-forest)]">
            {t('landing.faq.title')}
          </h2>

          <div className="divide-y divide-[var(--us-sage)]/20 border-y border-[var(--us-sage)]/20">
            {FAQ_KEYS.map((key) => {
              const isOpen = openKey === key;
              return (
                <div key={key}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-lg text-[var(--us-forest)]">
                      {t(`landing.faq.${key}Question`)}
                    </span>
                    <ChevronDown
                      size={20}
                      className={cn(
                        'shrink-0 text-[var(--us-sage)] transition-transform',
                        isOpen && 'rotate-180'
                      )}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <p className="pb-5 font-body text-sm leading-relaxed text-[var(--us-forest)]/75">
                      {t(`landing.faq.${key}Answer`)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
