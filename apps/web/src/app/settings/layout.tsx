import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getI18n } from '@/i18n/server';

/*
 * Metadata for a client page.
 *
 * `settings/page.tsx` is a client component and cannot export metadata itself,
 * so without this layout the tab read the site's marketing title — the same
 * string as /dashboard and the hub. `noIndex` states what is already true of a
 * page behind a session.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('settings.title'), robots: { index: false, follow: false } };
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
