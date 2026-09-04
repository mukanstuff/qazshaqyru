'use client';

/**
 * Client-side bootstrap for /editor/[templateKey] (rendered only when the
 * URL has no ?id= yet — i.e. arriving fresh from the catalog/preview).
 *
 * Flow:
 *   1. /editor/[templateKey] renders <EditorBootstrap templateKey=... />
 *   2. EditorBootstrap POSTs /api/editor/from-template with credentials
 *      → server always creates a brand-new draft and returns its id
 *   3. EditorBootstrap router.replace('/editor/[templateKey]?id=...')
 *   4. Server page re-renders, finds the draft by ?id, renders the editor
 *
 * After step 3, ?id= stays in the URL bar — reloading or bookmarking it
 * keeps opening that same draft. There's no cookie involved: every fresh
 * "no ?id=" visit (catalog → preview → "Редактировать") creates a new draft
 * rather than guessing at an old one, since "continue editing" already has
 * its own explicit ?id= links from the dashboard.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/i18n';

export function EditorBootstrap({ templateKey }: { templateKey: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/editor/from-template', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ templateKey }),
        });
        if (!res.ok) {
          if (res.status === 401) {
            router.replace(`/login?redirect=${encodeURIComponent(`/editor/${templateKey}`)}`);
            return;
          }
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { invitationId: string };
        if (!cancelled) {
          router.replace(`/editor/${encodeURIComponent(templateKey)}?id=${encodeURIComponent(data.invitationId)}`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'unknown error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateKey, router, attempt]);

  /**
   * Deliberately chrome-free. This screen is a sub-second hop between the
   * catalog and the editor — it used to render inside <PublicShell>, so the
   * full marketing header and the four-column site footer flashed up around a
   * spinner on a page you cannot navigate from and are about to leave. The
   * editor it leads to has no site chrome either, so the shell also made the
   * transition jump.
   */
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-us-ivory p-8 text-center"
      role="status"
      aria-live="polite"
    >
      {error ? (
        <>
          <p className="font-display text-lg text-us-ink">{t('common.openingEditorFailed')}</p>
          <p className="font-body text-sm text-us-ink-muted">{error}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setAttempt((n) => n + 1);
              }}
              className="min-h-11 rounded-full bg-us-cta px-5 font-body text-sm text-white transition-colors hover:bg-us-cta-hover"
            >
              {t('common.retry')}
            </button>
            <Link href="/templates" className="font-body text-sm text-us-accent underline">
              ← {t('common.backToCatalog')}
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-us-accent border-t-transparent" />
          <p className="font-body text-sm text-us-ink-muted">{t('common.openingEditor')}</p>
        </>
      )}
    </div>
  );
}
