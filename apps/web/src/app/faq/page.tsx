import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getCurrentSession } from '@/lib/shared/api';
import { getI18n } from '@/i18n/server';
import { FaqPageClient } from './FaqPageClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { buildFaqPageSchema, resolveLandingFaqItems } from '@/lib/seo/json-ld';

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: 'FAQ — цены, ответ гостей, WhatsApp и Kaspi | QazShaqyru',
    description:
      'Сколько стоит онлайн-приглашение, как слать ссылку в WhatsApp, как гости подтверждают присутствие и как оплатить через Kaspi. Ответы QazShaqyru.',
    alternates: buildLanguageAlternates('/faq', urlLocale),
  };
}

export default async function FaqPage() {
  const [session, { t }] = await Promise.all([getCurrentSession(), getI18n()]);
  const faqItems = resolveLandingFaqItems(t);

  return (
    <>
      <JsonLd data={buildFaqPageSchema(faqItems)} />
      <FaqPageClient isLoggedIn={Boolean(session)} />
    </>
  );
}
