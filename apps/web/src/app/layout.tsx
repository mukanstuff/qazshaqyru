import { cookies } from 'next/headers';
import { AuthProvider } from '@/hooks/use-auth';
import { I18nProvider, detectLocaleFromString, type Locale } from '@/i18n';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata = {
  title: {
    default: 'Invito — Цифровые приглашения для торжеств',
    template: '%s · Invito',
  },
  description:
    'Создавайте элегантные цифровые приглашения на свадьбу, той, беташар, кыз узату и любые торжества. Гости отвечают в один клик.',
  metadataBase: process.env.APP_URL ? new URL(process.env.APP_URL) : undefined,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Invito',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport = {
  themeColor: '#0f0f0f',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  const userLang = cookieStore.get('user_lang')?.value;
  const initialLocale: Locale =
    detectLocaleFromString(cookieLocale) ||
    detectLocaleFromString(userLang) ||
    'ru';

  return (
    <html lang={initialLocale === 'kz' ? 'kk' : 'ru'} suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <I18nProvider initialLocale={initialLocale}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
