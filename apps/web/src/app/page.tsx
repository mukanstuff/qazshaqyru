import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { LandingPage } from '@/components/landing';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLandingPublicStats } from '@/lib/landing/public-stats';
import { getI18n } from '@/i18n/server';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { buildFaqPageSchema, buildHomeJsonLdGraph, resolveLandingFaqItems } from '@/lib/seo/json-ld';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: 'Онлайн-приглашение на той — ответы гостей и рассадка | QazShaqyru',
    description:
      'Электронное приглашение на той и свадьбу в Казахстане: шаблон за минуты, ответы гостей без звонков, семьи, рассадка и список для тойханы. Бесплатно с логотипом сервиса — Стандарт от 3 990 ₸.',
    alternates: buildLanguageAlternates('/', urlLocale),
  };
}

export default async function HomePage() {
  const [stats, { t }] = await Promise.all([getLandingPublicStats(), getI18n()]);
  const { getCurrentSession } = await import('@/lib/shared/api');
  const session = await getCurrentSession();
  const faqItems = resolveLandingFaqItems(t);

  return (
    <>
      <JsonLd data={buildHomeJsonLdGraph()} />
      <JsonLd data={buildFaqPageSchema(faqItems)} />
      <LandingPage
        publishedInvitations={stats.publishedInvitations}
        isLoggedIn={Boolean(session)}
      />
    </>
  );
}
