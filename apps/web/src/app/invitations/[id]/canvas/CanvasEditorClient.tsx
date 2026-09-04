'use client';

import type { EventType } from '@prisma/client';

import { useRef, useState } from 'react';
import { CanvasEditor } from '@/components/canvas/CanvasEditor';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

interface Props {
  invitationId: string;
  initialDocument: InvitationCanvasDocument;
  /** ISO `updatedAt` of the invitation as of the server render — used to
   * detect a concurrent save from another tab/device (see `save` below). */
  initialUpdatedAt: string;
  shareUrl: string;
  locale: 'ru' | 'kz';
  /**
   * 2026-08-14: editorMode controls WHO is at the keyboard (drives CanvasEditor's chrome).
   *   'admin' (default) — chromeMode toggle: minimal preview ↔ full edit.
   *   'guest'           — single-tap edit, no chrome, no preview-then-edit step.
   * Driven by ?mode=guest querystring at the route level.
   */
  editorMode?: 'admin' | 'guest';
  /** Current public slug (no leading /i/) — powers the editor's own "Ссылка" tab. */
  invitationSlug?: string;
  /** Drives the ready-made greetings offered in the editor Texts tab. */
  eventType?: EventType;
  fullAccess?: boolean;
  priceKzt?: number;
}

export function CanvasEditorClient({
  invitationId,
  initialDocument,
  initialUpdatedAt,
  shareUrl,
  locale,
  editorMode = 'admin',
  invitationSlug,
  eventType,
  fullAccess,
  priceKzt,
}: Props) {
  const [doc, setDoc] = useState<InvitationCanvasDocument>(initialDocument);
  // Tracks the invitation's `updatedAt` as of the last successful save/load,
  // sent back as `baseVersion` so the server can detect a concurrent save
  // from another tab/device instead of silently overwriting it.
  const baseVersionRef = useRef(initialUpdatedAt);

  const save = async (d: InvitationCanvasDocument, options?: { keepalive?: boolean }) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/canvas`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ document: d, baseVersion: baseVersionRef.current }),
        keepalive: options?.keepalive,
      });
      if (res.status === 409) {
        // Another tab/device saved this invitation in the meantime — do NOT
        // keep retrying with a stale baseVersion (every retry would conflict
        // again) and do NOT silently overwrite their edit. Force a reload so
        // the user picks up the latest version before continuing.
        if (typeof window !== 'undefined') {
          window.alert(
            locale === 'kz'
              ? 'Бұл шақыру басқа терезеде өзгертілді. Жалғастыру үшін бетті жаңартыңыз.'
              : 'Это приглашение было изменено в другом окне. Обновите страницу, чтобы продолжить.'
          );
          window.location.reload();
        }
        throw new Error('canvas_conflict');
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`save_failed: ${res.status} ${text}`);
      }
      const data = await res.json().catch(() => null);
      if (data?.updatedAt) baseVersionRef.current = data.updatedAt;
    } catch (err) {
      console.error('[CanvasEditorClient] save failed', err);
      throw err;
    }
  };

  // 2026-08-17: EditorToolbar owns the "Как видит гость" preview toggle internally.
  // No outer header here — Chrome (full | minimal) is driven by CanvasEditor.
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#fcfcfb]" data-editor-mode={editorMode}>
      <div className="min-h-0 flex-1">
        <CanvasEditor
          initialDocument={doc}
          onChange={setDoc}
          onSaveRequest={save}
          shareUrl={shareUrl}
          locale={locale}
          editorMode={editorMode}
          invitationId={invitationId}
          invitationSlug={invitationSlug}
          eventType={eventType}
          fullAccess={fullAccess}
          priceKzt={priceKzt}
        />
      </div>
    </div>
  );
}