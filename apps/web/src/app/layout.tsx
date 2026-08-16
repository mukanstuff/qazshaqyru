import { cookies, headers } from 'next/headers';

import { ClientProviders } from '@/components/shared/ClientProviders';

import { I18nProvider } from '@/i18n';

import { detectLocaleFromString, type Locale } from '@/i18n/shared';
import { LOCALE_HEADER } from '@/lib/seo/hreflang';

import { Toaster } from '@/components/ui/toaster';
import { SITE_ORIGIN_FALLBACK } from '@/lib/seo/site';

import './globals.css';
import '@/styles/kz-fonts.css';
import '@/styles/editor-scrollbars.css';
import '@/styles/canvas-editor.css';

export const metadata = {
  title: {
    default:
      'Онлайн-приглашение на той — ответы гостей и рассадка | QazShaqyru',
    template: '%s — QazShaqyru',
  },
  description:
    'Цифровое приглашение на той и свадьбу в Казахстане: шаблон за минуты, ответы гостей без звонков, семьи, рассадка и список для тойханы. Разовая оплата цены шаблона = полный доступ без водяного знака.',
  metadataBase: new URL(process.env.APP_URL || SITE_ORIGIN_FALLBACK),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'QazShaqyru',
    title: 'Онлайн-приглашение на той — ответы гостей и рассадка | QazShaqyru',
    description:
      'Цифровое приглашение на той и свадьбу: ответы гостей, семьи, рассадка и список для тойханы. Разовая оплата цены шаблона = полный доступ без водяного знака.',
    images: [
      { url: '/og-default.png', width: 1200, height: 630, alt: 'QazShaqyru — цифровые приглашения для тои и торжеств' },
    ],
    alternateLocale: ['kk_KZ'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Онлайн-приглашение на той — ответы гостей и рассадка | QazShaqyru',
    description:
      'Цифровые приглашения для тоев в Казахстане: ответы гостей, список и файл для тойханы — не только красивый шаблон.',
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const pathLocale = headerStore.get(LOCALE_HEADER);
  const cookieLocale = cookieStore.get('locale')?.value;
  const userLang = cookieStore.get('user_lang')?.value;
  const initialLocale: Locale =
    (pathLocale ? detectLocaleFromString(pathLocale) : null) ||
    detectLocaleFromString(cookieLocale) ||
    detectLocaleFromString(userLang) ||
    'ru';

  return (
    <html
      lang={initialLocale === 'kz' ? 'kk' : 'ru'}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-screen bg-white font-body text-us-ink antialiased">
        <I18nProvider initialLocale={initialLocale}>
          <ClientProviders>
            {children}
            <Toaster />
          </ClientProviders>
        </I18nProvider>
      </body>
    </html>
  );
}
