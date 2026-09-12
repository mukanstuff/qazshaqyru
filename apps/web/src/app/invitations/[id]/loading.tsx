import { Loader2 } from 'lucide-react';
import { getI18n } from '@/i18n/server';

export default async function InvitationsLoading() {
  // The only string on this screen was typed in Russian, so a Kazakh visitor
  // saw "Загрузка..." every time a route was still compiling.
  const { t } = await getI18n();
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-us-ivory">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-us-accent" aria-hidden="true" />
        <p className="font-body text-sm text-us-ink-muted">{t('common.loading')}</p>
      </div>
    </div>
  );
}
