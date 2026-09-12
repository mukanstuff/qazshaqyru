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
  // No trailing "| QazShaqyru" here — the root layout's title.template
  // ("%s — QazShaqyru") already appends it once; adding it here doubled it
  // in the actual <title> tag.
  const title =
    locale === 'kz'
      ? 'Онлайн шақыру бағасы — үлгі бағасынан бастап'
      : 'Цены на онлайн-приглашение — от цены шаблона';
  const description =
    locale === 'kz'
      ? 'Шақыруды жасау, түзету және жариялау тегін. Үлгі бағасын бір рет төлеу сервис белгісін алып тастайды және қонақ функциялары мен тойханаға тізімді ашады. Төлем Kaspi арқылы.'
      : 'Создание, редактирование и публикация приглашения — бесплатно. Разовая оплата цены шаблона убирает логотип сервиса и открывает функции для гостей и список для тойханы. Оплата через Kaspi.';
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
              ? 'Онлайн шақырулар: қонақ жауабы, тізім, отырғызу, тойханаға файл. Жариялау тегін, үлгі ақысы сервис белгісін алып тастайды.'
              : 'Онлайн-приглашения: ответы гостей, список, рассадка, файл для тойханы. Публикация бесплатна, оплата шаблона убирает логотип сервиса.',
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
            {/* This used to read "Публикация — разовая оплата цены выбранного
                шаблона", which stopped being true on 2026-08-26: publishing is
                free and watermarked, and the payment removes the watermark and
                unlocks the guest tools. A price page that misstates what the
                money buys is worse than one that undersells. */}
            {locale === 'kz'
              ? 'Шақыруды жасау, түзету және жариялау тегін. Таңдаған үлгі бағасын бір рет төлесеңіз, сервис белгісі жоғалады және қонақтар тізімі, жауаптар, ресторанға арналған файл ашылады.'
              : 'Создание, редактирование и публикация приглашения — бесплатно. Разовая оплата цены выбранного шаблона убирает логотип сервиса и открывает список гостей, ответы и файл для ресторана.'}
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <PricingPageContent minTemplatePriceKzt={minTemplatePriceKzt} />
      </div>
    </PublicShell>
  );
}
