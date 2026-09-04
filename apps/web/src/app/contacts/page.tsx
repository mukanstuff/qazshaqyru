import { headers } from 'next/headers';
import { getCurrentSession } from '@/lib/shared/api';
import { getI18n } from '@/i18n/server';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { ContactsPageClient } from './ContactsPageClient';

export async function generateMetadata() {
  const [{ t }, headerStore] = await Promise.all([getI18n(), headers()]);
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: t('site.meta.contacts'),
    description: t('site.meta.contactsDescription'),
    alternates: buildLanguageAlternates('/contacts', urlLocale),
  };
}

export default async function ContactsPage() {
  const session = await getCurrentSession();
  return <ContactsPageClient isLoggedIn={Boolean(session)} />;
}