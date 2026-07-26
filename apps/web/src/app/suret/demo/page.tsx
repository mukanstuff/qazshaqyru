import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentSession } from '@/lib/shared/api';
import { PublicShell } from '@/components/shared/PublicShell';
import { Button } from '@/components/ui/button';
import { SuretRenderer } from '@/components/suret/SuretRenderer';
import { SURET_UZATU_PILOT } from '@/lib/templates/suret-manifests';
import { getI18n } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Сүрет — фото-шақыру | QazShaqyru',
  description:
    'WhatsApp Status пен Instagram үшін бір сурет: ат пен күнді жазып, PNG жүктеңіз.',
  robots: { index: false, follow: false },
};

export default async function SuretDemoPage() {
  const [session, { locale }] = await Promise.all([getCurrentSession(), getI18n()]);
  const isKz = locale === 'kz';

  return (
    <PublicShell isLoggedIn={Boolean(session)}>
      <div className="us-container space-y-6 py-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-us-ink-muted">
            {isKz ? 'Сүрет · қыз ұзату' : 'Сүрет · қыз ұзату'}
          </p>
          <h1 className="font-display text-3xl text-us-ink">
            {isKz ? 'Фото-шақыру (Stories)' : 'Фото-приглашение (Stories)'}
          </h1>
          <p className="mt-2 font-body text-sm text-us-ink-muted">
            {isKz
              ? 'WhatsApp Status пен Instagram үшін бір сурет. Аты мен күнді жазып, PNG жүктеңіз. Үлгі әзірленуде — әзірге сайт-шақырудан бастаңыз.'
              : 'Одна картинка для WhatsApp Status и Instagram. Впишите имена и дату, скачайте PNG. Шаблон ещё готовится — пока начните с приглашения-сайта.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/templates">
                {isKz ? 'Үлгілерге оралу' : 'К шаблонам'}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/templates?category=wedding">
                {isKz ? 'Үйлену үлгісімен бастау' : 'Начать со свадебного'}
              </Link>
            </Button>
          </div>
        </div>
        <SuretRenderer
          manifest={SURET_UZATU_PILOT}
          locale={isKz ? 'kz' : 'ru'}
        />
      </div>
    </PublicShell>
  );
}
