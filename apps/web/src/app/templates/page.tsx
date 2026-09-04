import type { Metadata } from 'next';
import { headers } from 'next/headers';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { getI18n } from '@/i18n/server';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { TemplatesClient } from './TemplatesClient';

export const dynamic = 'force-dynamic';

// No trailing "— QazShaqyru" in either title — the root layout's
// title.template ("%s — QazShaqyru") already appends it once.
const META = {
  ru: {
    title: 'Каталог шаблонов приглашений',
    description:
      'Готовые дизайны для свадьбы, той, беташар и других казахстанских торжеств. Живое превью, разовая оплата шаблона — без подписки.',
  },
  kz: {
    title: 'Шақыру үлгілерінің каталогы',
    description:
      'Үйлену той, той, беташар және басқа қазақстандық мерекелерге дайын дизайндар. Тірі алдын ала қарау, үлгіге бір реттік төлем — жазылымсыз.',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const [{ locale }, headerStore] = await Promise.all([getI18n(), headers()]);
  const meta = META[locale === 'kz' ? 'kz' : 'ru'];
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  const alternates = buildLanguageAlternates('/templates', urlLocale);

  return {
    title: meta.title,
    description: meta.description,
    alternates,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      siteName: 'QazShaqyru',
      url: '/templates',
      locale: locale === 'kz' ? 'kk_KZ' : 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function TemplatesPage() {
  const [prismaTemplates, session] = await Promise.all([
    prisma.template.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    getCurrentSession(),
  ]);

  return (
    <TemplatesClient
      templates={prismaTemplates}
      isLoggedIn={Boolean(session)}
    />
  );
}
