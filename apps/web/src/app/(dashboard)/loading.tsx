import { EditorWorkspaceShell } from '@/components/editor/EditorWorkspaceShell';
import { getI18n } from '@/i18n/server';

export default async function DashboardLoading() {
  const { t } = await getI18n();

  return (
    <EditorWorkspaceShell>
      <div className="us-container flex min-h-[50vh] flex-col items-center justify-center gap-6 py-12">
        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-us-border bg-us-surface" />
          ))}
        </div>
        <div className="h-32 w-full max-w-3xl animate-pulse rounded-lg border border-us-border bg-us-surface" />
        <p className="font-body text-sm text-us-ink-muted">{t('common.loading')}</p>
      </div>
    </EditorWorkspaceShell>
  );
}
