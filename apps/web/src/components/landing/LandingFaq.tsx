'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { useI18n } from '@/i18n';
import { FAQ_KEYS } from '@/lib/site/faq-keys';
import { cn } from '@/lib/shared/utils';

/** FAQ — editorial accordion, warm paper background */
export function LandingFaq() {
  const { t } = useI18n();
  const [openKey, setOpenKey] = useState<string | null>(FAQ_KEYS[0] ?? null);

  return (
    <section
      id="faq"
      className="py-20 md:py-28"
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      <div className="mx-auto max-w-landing px-5 sm:px-6 lg:px-8">
        <div
          className="mx-auto max-w-2xl rounded-2xl border px-5 py-8 sm:px-8 sm:py-10"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-paper)',
          }}
        >
          <p className="us-overline mb-4 text-center" style={{ color: 'var(--color-olive-deep)' }}>
            {t('landing.faq.overline')}
          </p>
          <h2
            className="mb-10 text-center"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(1.5rem, 3vw + 0.5rem, 2.25rem)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              color: 'var(--color-ink)',
            }}
          >
            {t('landing.faq.title')}
          </h2>

          {/* Accordion items */}
          <div
            className="divide-y"
            style={{
              borderTop: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {FAQ_KEYS.map((key) => {
              const isOpen = openKey === key;
              return (
                <div key={key}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors"
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    aria-expanded={isOpen}
                    style={{ color: 'var(--color-ink)' }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {t(`landing.faq.${key}Question`)}
                    </span>
                    <ChevronDown
                      size={20}
                      className={cn(
                        'shrink-0 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )}
                      style={{ color: 'var(--color-terra)' }}
                      aria-hidden
                    />
                  </button>
                  {isOpen && (
                    <p
                      className="pb-5 text-sm leading-relaxed"
                      style={{ color: 'var(--color-ink-muted)' }}
                    >
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
