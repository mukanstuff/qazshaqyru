'use client';

/**
 * Client-side bootstrap for /editor/[templateKey].
 *
 * Why client-side? Next.js 14 forbids `cookies().set()` from server components
 * — only server actions / route handlers can mutate cookies. The draft-id
 * cookie is set by /api/editor/from-template, so we POST that route from the
 * browser (which sends the session cookie), then router.replace back to the
 * editor with ?id=<new draft uuid>.
 *
 * Flow:
 *   1. /editor/[templateKey] renders <EditorBootstrap templateKey=... />
 *   2. EditorBootstrap POSTs /api/editor/from-template with credentials
 *      → server creates draft + sets editor:inv:{slug} cookie + returns id
 *   3. EditorBootstrap router.replace('/editor/[templateKey]?id=...')
 *   4. Server page re-renders, finds existing draft (via ?id), renders editor
 *
 * After step 3, ?id= stays in the URL bar. If the user reloads, the server
 * page picks up the same id and re-renders the editor. Subsequent visits
 * with the cookie in place skip step 2 entirely.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicShell } from '@/components/shared/PublicShell';

export function EditorBootstrap({ templateKey }: { templateKey: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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
            router.replace(`/login?next=${encodeURIComponent(`/editor/${templateKey}`)}`);
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
  }, [templateKey, router]);

  return (
    <PublicShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        {error ? (
          <>
            <p className="font-display text-lg text-us-ink">Не удалось открыть редактор</p>
            <p className="font-body text-sm text-us-ink-muted">{error}</p>
            <a
              href="/templates"
              className="font-body text-sm text-us-accent underline"
            >
              ← К каталогу шаблонов
            </a>
          </>
        ) : (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-us-accent border-t-transparent" />
            <p className="font-body text-sm text-us-ink-muted">Открываем редактор…</p>
          </>
        )}
      </div>
    </PublicShell>
  );
}
