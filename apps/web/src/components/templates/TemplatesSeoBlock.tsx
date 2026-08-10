'use client';

import { Plus } from 'lucide-react';
import { useI18n } from '@/i18n';

const FAQ_KEYS = ['howToChoose', 'paymentWhen', 'canEditAfter', 'mixedLanguages'] as const;

export function TemplatesSeoBlock() {
  const { t } = useI18n();

  return (
    <section className="border-t border-us-border/60 bg-us-ivory/50 py-10 lg:py-14">
      <div className="us-container space-y-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="font-display text-2xl text-us-ink sm:text-3xl">
            {t('templatesPage.faqTitle')}
          </h2>
          <p className="font-body text-sm leading-relaxed text-us-ink-muted sm:text-base">
            {t('templatesPage.faqLead')}
          </p>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-us-border rounded-2xl border border-us-border/70 bg-white">
          {FAQ_KEYS.map((key) => {
            const question = t(`templatesPage.faqItems.${key}.question` as const);
            const answer = t(`templatesPage.faqItems.${key}.answer` as const);
            return (
              <details
                key={key}
                className="group px-4 py-3 transition-colors open:bg-us-ivory/60 sm:px-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-base text-us-ink sm:text-lg">
                  <span>{question}</span>
                  <Plus
                    className="h-4 w-4 shrink-0 text-us-ink-muted transition-transform group-open:rotate-45"
                    aria-hidden
                  />
                </summary>
                <p className="mt-2 font-body text-sm leading-relaxed text-us-ink-muted">
                  {answer}
                </p>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}