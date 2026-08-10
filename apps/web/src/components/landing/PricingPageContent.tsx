'use client';

import { Check } from 'lucide-react';

import { LocaleLink } from '@/components/seo/LocaleLink';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { getWhatsappHref } from '@/lib/site/legal-config';

interface PricingPageContentProps {
  minTemplatePriceKzt: number;
}

/** Full pricing page — two cards: one invitation (from {MIN} ₸) + agency (20 000 ₸/мес). */
export function PricingPageContent({ minTemplatePriceKzt }: PricingPageContentProps) {
  const { t, locale } = useI18n();
  const formattedMin = minTemplatePriceKzt.toLocaleString('ru-RU');

  return (
    <div className="space-y-12" data-testid="pricing-page-content">
      {/* Two-card grid */}
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {/* Card 1 — One invitation */}
        <article
          className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm"
          data-testid="pricing-plan-single"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-us-ink-muted">
            {locale === 'kz' ? 'Бір шақыру' : 'Одно приглашение'}
          </p>
          <div className="mt-1 font-display text-4xl text-us-ink">
            <span className="text-us-accent">от {formattedMin}</span>
            <span className="ml-1 text-lg text-us-ink-muted">₸</span>
          </div>
          <p className="mt-2 text-sm text-us-ink-muted">
            {locale === 'kz'
              ? 'Бір реттік төлем — бір шақыруға. Жасау мен түзету тегін.'
              : 'Разовый платёж за одно приглашение. Создание и правки бесплатно.'}
          </p>
          <ul className="mt-5 flex-1 space-y-2">
            {(['1', '2', '3'] as const).map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-us-ink-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-us-accent" aria-hidden />
                <span>
                  {locale === 'kz'
                    ? key === '1'
                      ? 'Сервис белгісі жоқ'
                      : key === '2'
                        ? 'Қонақтар тізімі және жауаптар'
                        : 'Ресторанға бір файл тізім'
                    : key === '1'
                      ? 'Без логотипа сервиса'
                      : key === '2'
                        ? 'Список гостей и ответы'
                        : 'Список для ресторана одним файлом'}
                </span>
              </li>
            ))}
          </ul>
          <Button asChild variant="default" className="mt-6 min-h-11 w-full">
            <LocaleLink href="/templates">
              {locale === 'kz' ? 'Үлгі таңдау' : 'Выбрать шаблон'}
            </LocaleLink>
          </Button>
          <p className="mt-3 text-center text-xs text-us-ink-muted">
            {t('landing.v2.pricing.page.oneTimeNote')}
          </p>
        </article>

        {/* Card 2 — Agency */}
        <article
          className="flex flex-col rounded-2xl border border-us-accent/35 bg-us-accent p-6 text-white shadow-us-md ring-1 ring-us-accent/20"
          data-testid="pricing-plan-agency"
        >
          <p className="mb-3 inline-flex w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            {locale === 'kz' ? 'Кәсіпқойларға' : 'Профессионалам'}
          </p>
          <p className="text-xs font-semibold uppercase tracking-widest text-white">
            {locale === 'kz' ? 'Агенттіктерге' : 'Для агентств'}
          </p>
          <div className="mt-1 font-display text-4xl">
            20 000
            <span className="ml-1 text-lg text-white/70">₸/мес</span>
          </div>
          <p className="mt-2 text-sm text-white/80">
            {locale === 'kz'
              ? 'Шексіз шақыру жасау + оқу курсы. Фрилансерлер мен агенттіктерге.'
              : 'Безлимит приглашений + обучающий курс. Для фрилансеров и агентств.'}
          </p>
          <ul className="mt-5 flex-1 space-y-2">
            {(['1', '2', '3'] as const).map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" aria-hidden />
                <span>
                  {locale === 'kz'
                    ? key === '1'
                      ? 'Шексіз шақыру'
                      : key === '2'
                        ? 'Оқу курсына қолжетімділік'
                        : 'Клиенттерге шақыру жасау'
                    : key === '1'
                      ? 'Безлимит приглашений'
                      : key === '2'
                        ? 'Доступ к обучающему курсу'
                        : 'Создание приглашений для клиентов'}
                </span>
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="mt-6 min-h-11 w-full bg-white text-us-accent hover:bg-white/90">
            <a
              href={getWhatsappHref(
                locale === 'kz'
                  ? 'Сәлем! Агенттік тарифі туралы сұрағым бар еді.'
                  : 'Здравствуйте! Хочу узнать об агентском тарифе.',
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              {locale === 'kz' ? 'WhatsApp-та жазыңыз' : 'Написать в WhatsApp'}
            </a>
          </Button>
          <p className="mt-3 text-center text-xs text-white/70">
            {t('landing.v2.pricing.page.monthlyNote')}
          </p>
        </article>
      </div>

      <p className="mx-auto max-w-lg text-center text-sm text-us-ink-muted">
        {t('landing.v2.pricing.page.freeReminder')}
      </p>
    </div>
  );
}
