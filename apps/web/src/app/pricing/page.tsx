import type { Metadata } from 'next';
import { headers } from 'next/headers';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { PublicShell } from '@/components/shared/PublicShell';
import { PricingPageContent } from '@/components/landing/PricingPageContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { buildServiceSchema, buildSoftwareApplicationSchema } from '@/lib/seo/json-ld';
import { getI18n } from '@/i18n/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const [{ locale, t }, headerStore] = await Promise.all([getI18n(), headers()]);
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  const title =
    locale === 'kz'
      ? 'Онлайн шақыру бағасы — от цены шаблона (полный доступ) | QazShaqyru'
      : 'Цены на онлайн-приглашение — от цены шаблона (полный доступ) | QazShaqyru';
  const description =
    locale === 'kz'
      ? 'Шақыруды тегін жасаңыз — QazShaqyru белгісімен. Разовая оплата цены шаблона даёт полный доступ: без водяного знака, все функции гостей, список для тойханы. Төлем Kaspi.'
      : 'Создать приглашение бесплатно с логотипом сервиса. Разовая оплата цены шаблона = полный доступ (без водяного знака, все функции гостей). Оплата Kaspi.';
  return {
    title,
    description,
    alternates: buildLanguageAlternates('/pricing', urlLocale),
  };
}

export default async function PricingPage() {
  const [session, { locale, t }] = await Promise.all([getCurrentSession(), getI18n()]);

  // Get min template price from all active templates
  const minTemplate = await prisma.template.findFirst({
    where: { isActive: true },
    orderBy: { priceKzt: 'asc' },
    select: { priceKzt: true },
  });
  // 2026-07-30 OWNER MODEL (PRODUCT_MODEL_AND_RULES.md):
  // Real price shown to users = minimum active Template.priceKzt.
  // This ?? 3990 is a dev-only fallback when the catalog is empty.
  const minTemplatePriceKzt = minTemplate?.priceKzt ?? 3_990;

  return (
    <PublicShell isLoggedIn={Boolean(session)}>
      <JsonLd
        data={buildServiceSchema({
          name: locale === 'kz' ? 'QazShaqyru цифрлық шақырулары' : 'Цифровые приглашения QazShaqyru',
          description:
            locale === 'kz'
              ? 'Онлайн шақырулар: қонақ жауабы, тізім, отырғызу, тойханаға файл. Разовая оплата цены шаблона (полный доступ).'
              : 'Онлайн-приглашения: ответы гостей, список, рассадка, файл для тойханы. Разовая оплата цены шаблона (полный доступ).',
          path: '/pricing',
        })}
      />
      <JsonLd data={buildSoftwareApplicationSchema()} />
      <div className="border-b border-us-border bg-us-ivory/40 py-10">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-us-ink-muted">
            {t('landing.v2.pricing.overline')}
          </p>
          <h1 className="font-display text-4xl text-us-ink md:text-5xl">
            {locale === 'kz'
              ? 'Тегін жасаңыз — дайын болғанда төлеңіз'
              : `${t('landing.v2.pricing.title')} ${t('landing.v2.pricing.titleAccent')}`}
          </h1>
          <p className="mt-4 font-body text-sm text-us-ink-muted md:text-base">
            {locale === 'kz'
              ? 'Шақыруды жинап, сервис белгісімен жариялау тегін. Белгісіз сілтеме, қонақтар тізімі және ресторанға файл — разовая оплата цены шаблона (полный доступ).'
              : 'Собрать приглашение и опубликовать с логотипом сервиса можно бесплатно. Без логотипа, со списком гостей и файлом для ресторана — разовая оплата цены шаблона (полный доступ).'}
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <PricingPageContent minTemplatePriceKzt={minTemplatePriceKzt} />
      </div>
    </PublicShell>
  );
}
