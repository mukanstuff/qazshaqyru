'use client';

import { useState, useTransition } from 'react';
import { CanvasEditor } from '@/components/canvas/CanvasEditor';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

interface Props {
  invitationId: string;
  initialDocument: InvitationCanvasDocument;
  shareUrl: string;
  locale: 'ru' | 'kz';
}

export function CanvasEditorClient({ invitationId, initialDocument, shareUrl, locale }: Props) {
  const [doc, setDoc] = useState<InvitationCanvasDocument>(initialDocument);
  const [, start] = useTransition();
  const save = async (d: InvitationCanvasDocument) => {
    start(async () => {
      try {
        await fetch(`/api/invitations/${invitationId}/canvas`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ document: d }),
        });
      } catch {
        // CanvasEditor shows 'error' state if save throws — we bubble up via
        // onSaveRequest's promise rejection.
        throw new Error('save_failed');
      }
    });
  };
  return (
    <CanvasEditor
      initialDocument={doc}
      onChange={setDoc}
      onSaveRequest={save}
      shareUrl={shareUrl}
      locale={locale}
    />
  );
}
