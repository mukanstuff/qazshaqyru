import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { LandingPage } from '@/components/landing';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLandingPublicStats } from '@/lib/landing/public-stats';
import { getI18n } from '@/i18n/server';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { buildFaqPageSchema, buildHomeJsonLdGraph, resolveLandingFaqItems } from '@/lib/seo/json-ld';
import prisma from '@/lib/shared/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: 'Онлайн-приглашение на той — ответы гостей и рассадка | QazShaqyru',
    description:
      'Электронное приглашение на той и свадьбу в Казахстане: шаблон за минуты, ответы гостей без звонков, семьи, рассадка и список для тойханы. Бесплатно с логотипом сервиса. Разовая оплата цены шаблона = полный доступ (без водяного знака + все функции).',
    alternates: buildLanguageAlternates('/', urlLocale),
  };
}

export default async function HomePage() {
  const [stats, { t }] = await Promise.all([getLandingPublicStats(), getI18n()]);
  const { getCurrentSession } = await import('@/lib/shared/api');
  const session = await getCurrentSession();
  const faqItems = resolveLandingFaqItems(t);

  // Get min template price from all active templates
  const minTemplate = await prisma.template.findFirst({
    where: { isActive: true },
    orderBy: { priceKzt: 'asc' },
    select: { priceKzt: true },
  });
  // 2026-07-30 OWNER MODEL (docs/PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md):
  // Real price for users = the actual Template.priceKzt of the chosen template.
  // This fallback is ONLY for when DB is empty (dev / first deploy).
  // NEVER hardcode 3990 in user strings, CTAs, or marketing.
  const minTemplatePriceKzt = minTemplate?.priceKzt ?? 3_990;

  return (
    <>
      <JsonLd data={buildHomeJsonLdGraph()} />
      <JsonLd data={buildFaqPageSchema(faqItems)} />
      <LandingPage
        publishedInvitations={stats.publishedInvitations}
        isLoggedIn={Boolean(session)}
        minTemplatePriceKzt={minTemplatePriceKzt}
      />
    </>
  );
}
