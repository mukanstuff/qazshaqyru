import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { CATEGORY_ROUTE_MAP, type CategoryRouteSlug } from '@/lib/templates/template-categories';
import { getCategoryPageMetadata, isValidCategoryRoute } from '@/lib/templates/category-seo';
import { getCategorySeoCopy } from '@/lib/seo/category-copy';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { buildBreadcrumbSchema, buildFaqPageSchema } from '@/lib/seo/json-ld';
import { JsonLd } from '@/components/seo/JsonLd';
import { CategorySeoBlocks } from '@/components/seo/CategorySeoBlocks';
import { getI18n } from '@/i18n/server';
import { ru } from '@/i18n/messages/ru';
import { kz } from '@/i18n/messages/kz';
import { CategoryTemplatesClient } from './CategoryTemplatesClient';

export const dynamic = 'force-dynamic';

type Props = { params: { category: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = params.category;
  if (!isValidCategoryRoute(route)) {
    return { title: 'Шаблоны' };
  }

  const [{ locale }, headerStore] = await Promise.all([getI18n(), headers()]);
  const meta = getCategoryPageMetadata(locale, route, { ru, kz });
  const siteName = 'QazShaqyru';
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  const alternates = buildLanguageAlternates(`/templates/${route}`, urlLocale);

  return {
    title: `${meta.title} | ${siteName}`,
    description: meta.description,
    alternates,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      siteName,
      url: `/templates/${route}`,
      locale: locale === 'kz' ? 'kk_KZ' : 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function CategoryTemplatesPage({ params }: Props) {
  const route = params.category;
  if (!isValidCategoryRoute(route)) notFound();

  const [{ locale }] = await Promise.all([getI18n()]);
  const seoCopy = getCategorySeoCopy(route as CategoryRouteSlug, locale === 'kz' ? 'kz' : 'ru');
  const dbCategory = CATEGORY_ROUTE_MAP[route as CategoryRouteSlug];
  const [templates, session] = await Promise.all([
    prisma.template.findMany({
      where: { isActive: true, category: dbCategory },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    getCurrentSession(),
  ]);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'QazShaqyru', path: '/' },
          { name: 'Шаблоны', path: '/templates' },
          { name: route, path: `/templates/${route}` },
        ])}
      />
      <JsonLd data={buildFaqPageSchema(seoCopy.faqs)} />
      <CategoryTemplatesClient
        routeSlug={route as CategoryRouteSlug}
        templates={templates}
        isLoggedIn={Boolean(session)}
        seoSlot={<CategorySeoBlocks copy={seoCopy} />}
      />
    </>
  );
}
