'use client';

import { useState } from 'react';
import { CanvasEditor } from '@/components/canvas/CanvasEditor';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

interface Props {
  invitationId: string;
  initialDocument: InvitationCanvasDocument;
  shareUrl: string;
  locale: 'ru' | 'kz';
  /**
   * 2026-08-14: editorMode controls WHO is at the keyboard (drives CanvasEditor's chrome).
   *   'admin' (default) — chromeMode toggle: minimal preview ↔ full edit.
   *   'guest'           — single-tap edit, no chrome, no preview-then-edit step.
   * Driven by ?mode=guest querystring at the route level.
   */
  editorMode?: 'admin' | 'guest';
}

export function CanvasEditorClient({ invitationId, initialDocument, shareUrl, locale, editorMode = 'admin' }: Props) {
  const [doc, setDoc] = useState<InvitationCanvasDocument>(initialDocument);

  const save = async (d: InvitationCanvasDocument, options?: { keepalive?: boolean }) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/canvas`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ document: d }),
        keepalive: options?.keepalive,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`save_failed: ${res.status} ${text}`);
      }
    } catch (err) {
      console.error('[CanvasEditorClient] save failed', err);
      throw err;
    }
  };

  // 2026-08-17: EditorToolbar owns the "Как видит гость" preview toggle internally.
  // No outer header here — Chrome (full | minimal) is driven by CanvasEditor.
  return (
    <div className="flex min-h-screen flex-col bg-[#fcfcfb]" data-editor-mode={editorMode}>
      <div className="flex-1">
        <CanvasEditor
          initialDocument={doc}
          onChange={setDoc}
          onSaveRequest={save}
          shareUrl={shareUrl}
          locale={locale}
          chrome="full"
          editorMode={editorMode}
        />
      </div>
    </div>
  );
}