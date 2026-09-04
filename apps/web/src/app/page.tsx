import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { LandingPage } from '@/components/landing';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLandingPublicStats } from '@/lib/landing/public-stats';
import { getCategoryCounts } from '@/lib/landing/category-counts';
import { getI18n } from '@/i18n/server';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { buildFaqPageSchema, buildHomeJsonLdGraph, resolveLandingFaqItems } from '@/lib/seo/json-ld';
import prisma from '@/lib/shared/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  const { t } = await getI18n();
  return {
    title: t('meta.defaultTitle'),
    description: t('meta.description'),
    alternates: buildLanguageAlternates('/', urlLocale),
  };
}

export default async function HomePage() {
  const [stats, categoryCounts, { t }] = await Promise.all([
    getLandingPublicStats(),
    getCategoryCounts(),
    getI18n(),
  ]);
  const { getCurrentSession } = await import('@/lib/shared/api');
  const session = await getCurrentSession();
  const faqItems = resolveLandingFaqItems(t);

  // Get min template price from all active templates.
  //
  // Guarded. getLandingPublicStats() and getCurrentSession() already swallow
  // their own database failures, but this call did not — so a database that was
  // merely unreachable took the whole marketing homepage down with a 500
  // instead of degrading to the fallback price the next line already exists to
  // provide. (Observed: with Postgres unpublished, `/templates`, `/agency` and
  // `/login` all still rendered; `/` was the one page that hard-failed.)
  const minTemplate = await prisma.template
    .findFirst({
      where: { isActive: true },
      orderBy: { priceKzt: 'asc' },
      select: { priceKzt: true },
    })
    .catch((err: unknown) => {
      console.error('[landing] min template price unavailable, using fallback:', err);
      return null;
    });
  // 2026-07-30 OWNER MODEL (docs/PRODUCT_MODEL_AND_RULES.md + PRODUCT_DECISIONS_2026-07-30.md):
  // Real price for users = the actual Template.priceKzt of the chosen template.
  // This fallback is ONLY for when DB is empty (dev / first deploy).
  // NEVER hardcode 3990 in user strings, CTAs, or marketing.
  // Null, not 3990: the hero degrades to a qualitative promise when nothing is
  // priced, and a wrong number on the landing is worse than no number.
  const minTemplatePriceKzt = minTemplate?.priceKzt ?? null;

  return (
    <>
      <JsonLd data={buildHomeJsonLdGraph()} />
      <JsonLd data={buildFaqPageSchema(faqItems)} />
      <LandingPage
        publishedInvitations={stats.publishedInvitations}
        isLoggedIn={Boolean(session)}
        minTemplatePriceKzt={minTemplatePriceKzt}
        categoryCounts={categoryCounts}
      />
    </>
  );
}
