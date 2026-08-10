import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { SiteMarketingHeader } from '@/components/shared/SiteMarketingHeader';
import { SiteCompactFooter } from '@/components/shared/SiteCompactFooter';
import { SoftLocaleBanner } from '@/components/seo/SoftLocaleBanner';
import { getI18n } from '@/i18n/server';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { getCurrentSession } from '@/lib/shared/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: 'Курсы для фрилансеров — как зарабатывать на приглашениях | QazShaqyru',
    description:
      'Научитесь создавать красивые приглашения для тои и свадеб. Курс для начинающих фрилансеров — от настройки до первых клиентов.',
    alternates: buildLanguageAlternates('/courses', urlLocale),
  };
}

export default async function CoursesPage() {
  const { t } = await getI18n();
  const session = await getCurrentSession();

  const features = [
    {
      icon: '🎨',
      title: 'Дизайн приглашений',
      desc: 'Создание красивых цифровых приглашений для свадеб, тоев и других мероприятий',
    },
    {
      icon: '📱',
      title: 'Работа с клиентами',
      desc: 'Как находить заказчиков и общаться с ними в WhatsApp',
    },
    {
      icon: '💰',
      title: 'Продажи и ценообразование',
      desc: 'Сколько брать за работу, как формировать прайс',
    },
    {
      icon: '📋',
      title: 'Документы и договоры',
      desc: 'Оформление сделок, акты и работа через Казахстан',
    },
    {
      icon: '⏰',
      title: 'Управление временем',
      desc: 'Как делать 5-10 приглашений в неделю без выгорания',
    },
    {
      icon: '🚀',
      title: 'Масштабирование',
      desc: 'От фрилансера до небольшой студии',
    },
  ];

  const audience = [
    'Мамы в декрете, которые хотят дополнительный доход',
    'Студенты, ищущие удалённую работу',
    'Дизайнеры, желающие освоить новую нишу',
    'Организаторы мероприятий',
    'Никаких специальных навыков не нужно',
    'Работа из дома, свой график',
  ];

  const includes = [
    '8 видео-уроков (16 часов)',
    'Доступ к материалам навсегда',
    'Закрытый чат с куратором',
    'Шаблоны для портфолио',
    'Сертификат о прохождении',
  ];

  const faqs = [
    {
      q: 'Сколько времени занимает курс?',
      a: 'В среднем 2-3 часа в неделю. Можно проходить параллельно с основной работой.',
    },
    {
      q: 'Нужен ли опыт в дизайне?',
      a: 'Нет. Курс подходит для полных новичков. Главное — уметь пользоваться телефоном и WhatsApp.',
    },
    {
      q: 'Какие инструменты нужны?',
      a: 'Только телефон и доступ к нашей платформе (бесплатно для учеников курса).',
    },
    {
      q: 'Можно ли работать из любого города?',
      a: 'Да. Онлайн-формат позволяет работать откуда угодно — нужен только интернет.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <SoftLocaleBanner />
      <SiteMarketingHeader isLoggedIn={Boolean(session)} />

      <main className="pt-32">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-[#16A34A]/8 blur-[140px]" />
            <div className="absolute -right-32 bottom-1/4 h-[400px] w-[400px] rounded-full bg-[#F59E0B]/10 blur-[120px]" />
          </div>
          
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#16A34A]/10 px-4 py-2 text-sm font-medium text-[#16A34A]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#16A34A]" />
              Скоро запуск
            </div>
            
            <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-[#1F3A2E] md:text-5xl lg:text-6xl">
              Как зарабатывать на{' '}
              <span className="text-[#16A34A]">цифровых приглашениях</span>
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-lg text-[#6B8A92]">
              Онлайн-курс для тех, кто хочет начать freelance-карьеру в сфере event-дизайна. 
              От настройки шаблонов до первых заказов — за 4 недели.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 rounded-full bg-[#1F3A2E] px-8 py-4 text-base font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#14271F] hover:shadow-xl"
              >
                Записаться на курс
                <span className="text-[#BAE6FD]">→</span>
              </a>
              <span className="text-sm text-[#6B8A92]">
                Старт: сентябрь 2026
              </span>
            </div>
          </div>
        </section>

        {/* What You'll Learn */}
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-[#1F3A2E] md:text-4xl">
                Что вы получите
              </h2>
              <p className="text-[#6B8A92]">
                Практические навыки для работы с клиентами
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((item, i) => (
                <div
                  key={i}
                  className="group rounded-2xl border border-[#1F3A2E]/8 bg-gradient-to-br from-white to-[#FAFBFC] p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-4 text-4xl">{item.icon}</div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-[#1F3A2E]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#6B8A92]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Whom */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#FAFBFC] to-[#FFFBEB] py-20 md:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 top-1/3 h-[300px] w-[300px] rounded-full bg-[#BAE6FD]/10 blur-[100px]" />
          </div>
          
          <div className="relative mx-auto max-w-4xl px-6">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-[#1F3A2E] md:text-4xl">
                Для кого этот курс
              </h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {audience.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#16A34A]/10 text-[#16A34A]">
                    ✓
                  </span>
                  <span className="text-[#1F3A2E]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-[#16A34A]/20 bg-gradient-to-br from-[#1F3A2E] to-[#0EA5E9] p-8 text-center shadow-xl md:p-12">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#16A34A]/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-[#F59E0B]/20 blur-3xl" />
              
              <div className="relative">
                <span className="mb-4 inline-block rounded-full bg-[#16A34A] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  Early Bird
                </span>
                
                <div className="mb-2 font-display text-5xl font-bold text-white">
                  49 990 ₸
                </div>
                <div className="mb-6 text-white/70">
                  Вместо 79 990 ₸
                </div>
                
                <ul className="mb-8 space-y-3 text-left">
                  {includes.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/90">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A] text-xs text-white">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                
                <a
                  href="#waitlist"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#1F3A2E] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Записаться сейчас
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Waitlist CTA */}
        <section id="waitlist" className="bg-gradient-to-br from-[#16A34A] to-[#15803D] py-20 md:py-24">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold text-white md:text-4xl">
              Хотите узнать первыми?
            </h2>
            <p className="mb-8 text-lg text-white/90">
              Оставьте номер WhatsApp — сообщим, когда начнём набор на курс
            </p>
            
            <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                className="flex-1 rounded-full px-6 py-4 text-[#1F3A2E] shadow-lg"
              />
              <button
                type="submit"
                className="rounded-full bg-[#1F3A2E] px-8 py-4 font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#14271F]"
              >
                Отправить
              </button>
            </form>
            
            <p className="mt-4 text-sm text-white/70">
              Никакого спама. Только уведомление о старте.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-12 text-center font-display text-3xl font-bold text-[#1F3A2E] md:text-4xl">
              Частые вопросы
            </h2>
            
            <div className="space-y-4">
              {faqs.map((item, i) => (
                <details key={i} className="group rounded-xl border border-[#1F3A2E]/10 bg-[#FAFBFC]">
                  <summary className="flex cursor-pointer items-center justify-between p-5 font-medium text-[#1F3A2E]">
                    {item.q}
                    <span className="ml-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#16A34A]/10 text-[#16A34A] transition-transform group-open:rotate-180">
                      ↓
                    </span>
                  </summary>
                  <div className="border-t border-[#1F3A2E]/5 p-5 text-[#6B8A92]">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteCompactFooter />
    </div>
  );
}
