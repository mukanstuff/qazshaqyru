'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useI18n } from '@/i18n';
import { EditorWorkspaceShell } from '@/components/editor/EditorWorkspaceShell';

function DashboardSkeleton({ label }: { label: string }) {
  return (
    <EditorWorkspaceShell>
      <div className="us-container flex min-h-[50vh] flex-col items-center justify-center gap-6 py-12">
        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-us-border bg-us-surface" />
          ))}
        </div>
        <div className="h-32 w-full max-w-3xl animate-pulse rounded-lg border border-us-border bg-us-surface" />
        <p className="font-body text-sm text-us-ink-muted">{label}</p>
      </div>
    </EditorWorkspaceShell>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <DashboardSkeleton label={t('common.loading')} />;
  }

  if (!user) return null;

  return <>{children}</>;
}
