import { headers } from 'next/headers';
import { getCurrentSession } from '@/lib/shared/api';
import { getI18n } from '@/i18n/server';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { AboutPageClient } from './AboutPageClient';

export async function generateMetadata() {
  const [{ t }, headerStore] = await Promise.all([getI18n(), headers()]);
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: t('site.meta.about'),
    description: t('site.meta.aboutDescription'),
    alternates: buildLanguageAlternates('/about', urlLocale),
  };
}

export default async function AboutPage() {
  const session = await getCurrentSession();
  return <AboutPageClient isLoggedIn={Boolean(session)} />;
}
