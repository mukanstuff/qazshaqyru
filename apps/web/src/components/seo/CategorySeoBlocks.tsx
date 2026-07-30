'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';

import type { CategorySeoCopy } from '@/lib/seo/category-copy';

export function CategorySeoBlocks({ copy }: { copy: CategorySeoCopy }) {
  const { locale } = useI18n();
  const isKz = locale === 'kz';

  return (
    <section className="border-b border-us-border bg-us-ivory/30 py-10">
      <div className="us-container max-w-3xl space-y-8">
        <div className="space-y-4">
          {copy.intro.map((p) => (
            <p key={p.slice(0, 40)} className="font-body text-base leading-relaxed text-us-ink-muted">
              {p}
            </p>
          ))}
          <p className="font-body text-sm text-us-ink-muted">
            {isKz ? (
              <>
                Бағалар:{' '}
                <LocaleLink href="/pricing" className="text-us-accent hover:underline">
                  от цены шаблона (полный доступ после оплаты)
                </LocaleLink>
                . Сервис белгісімен жасау — тегін.
              </>
            ) : (
              <>
                Тарифы:{' '}
                <LocaleLink href="/pricing" className="text-us-accent hover:underline">
                  от цены шаблона (полный доступ после оплаты)
                </LocaleLink>
                . Сборка с логотипом сервиса — бесплатно.
              </>
            )}
          </p>
        </div>

        {copy.faqs.length > 0 ? (
          <div className="space-y-3">
            <h2 className="font-display text-2xl text-us-ink">
              {isKz ? 'Жиі қойылатын сұрақтар' : 'Частые вопросы'}
            </h2>
            <div className="divide-y divide-us-border border-y border-us-border">
              {copy.faqs.map((faq) => (
                <details key={faq.question} className="py-3">
                  <summary className="cursor-pointer font-display text-lg text-us-ink">
                    {faq.question}
                  </summary>
                  <p className="mt-2 font-body text-sm leading-relaxed text-us-ink-muted">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
