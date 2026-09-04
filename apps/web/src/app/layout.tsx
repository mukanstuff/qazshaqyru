import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';

import { ClientProviders } from '@/components/shared/ClientProviders';

import { I18nProvider } from '@/i18n';

import { detectLocaleFromString, type Locale } from '@/i18n/shared';
import { LOCALE_HEADER } from '@/lib/seo/hreflang';
import { getI18n } from '@/i18n/server';

import { Toaster } from '@/components/ui/toaster';
import { AnalyticsScripts } from '@/components/shared/AnalyticsScripts';
import { SITE_ORIGIN_FALLBACK } from '@/lib/seo/site';

import './globals.css';
import '@/styles/kz-fonts.css';
import '@/styles/editor-scrollbars.css';
import '@/styles/canvas-editor.css';
// Entrance animations for canvas elements. This sheet existed and the renderer
// has been adding its classes all along, but it was never imported anywhere —
// so `animation-name` resolved to `none` and no invitation ever animated.
import '@/styles/canvas-animations.css';
import '@/styles/invitation-hub.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: {
      default: t('meta.defaultTitle'),
      template: t('meta.titleTemplate'),
    },
    description: t('meta.description'),
    metadataBase: new URL(process.env.APP_URL || SITE_ORIGIN_FALLBACK),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: 'website',
      locale: 'ru_RU',
      siteName: 'QazShaqyru',
      title: t('meta.defaultTitle'),
      description: t('meta.description'),
      images: [
        { url: '/og-default.png', width: 1200, height: 630, alt: 'QazShaqyru — цифровые приглашения для тои и торжеств' },
      ],
      alternateLocale: ['kk_KZ'],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.defaultTitle'),
      description: t('meta.description'),
    },
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const pathLocale = headerStore.get(LOCALE_HEADER);
  const cookieLocale = cookieStore.get('locale')?.value;
  // A third source used to sit here: a `user_lang` cookie. Nothing in the
  // codebase ever set it, so that branch was permanently dead and the account's
  // own language never reached the UI. The sign-in routes now write the real
  // `locale` cookie from User.language instead (applyLocaleCookieFromUser).
  const initialLocale: Locale =
    (pathLocale ? detectLocaleFromString(pathLocale) : null) ||
    detectLocaleFromString(cookieLocale) ||
    'ru';

  return (
    <html
      lang={initialLocale === 'kz' ? 'kk' : 'ru'}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-screen bg-white font-body text-us-ink antialiased">
        <AnalyticsScripts />
        <I18nProvider initialLocale={initialLocale}>
          <ClientProviders>
            {/*
              Toaster is a CONTEXT PROVIDER, not a portal widget. It used to be
              rendered as a *sibling* of {children}, so ToastContext.Provider
              wrapped nothing: every useToast() call in the app fell through to
              the undefined-context fallback and got a fresh no-op object with
              fresh function identities on every single render.

              Two consequences, both live in production until now:
                1. Not one toast in the entire product ever appeared. Copy-link
                   confirmations, save errors, CSV-export failures — all silent.
                2. Any effect with `toast` in its dependency array re-ran on
                   every render forever. That is what flooded the dev terminal
                   with an endless GET /api/admin/templates/<id> loop from
                   TemplateBuilderClient.
            */}
            <Toaster>{children}</Toaster>
          </ClientProviders>
        </I18nProvider>
      </body>
    </html>
  );
}
