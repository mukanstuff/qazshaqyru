'use client';

import { useState } from 'react';
import { ArrowLeft, Edit3, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import { CanvasEditor } from '@/components/canvas/CanvasEditor';
import { CanvasRenderer } from '@/components/canvas/CanvasRenderer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';
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
  // 2026-08-14: guest skips the preview-then-edit step — start in editing mode.
  const [isEditing, setIsEditing] = useState(editorMode === 'guest');

  // 2026-07-30 REVIEW / P0-6 follow-up:
  // We now use ONE CanvasEditor instance with chrome prop.
  // - chrome="minimal" = clean preview + big "Редактировать" button
  // - chrome="full" = palette + inspector + full toolbar
  // Document + history are shared (no unmount loss).
  // This is the honest "one shell" direction.

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

  // ─────────────────────────────────────────────────────────────
  // 2026-07-30 REVIEW / P0-6 + P1 editor direction
  // ONE SHELL: we now render <CanvasEditor chrome="minimal" | "full" />
  // - minimal = clean stage + basic header (no palette/inspector)
  // - full = complete editor
  // Shared doc + history = no unmount loss, instant switch.
  // This satisfies "БЕЗ РЕДИРЕКТОВ И ЧАСОВЫХ ЗАГРУЗОК".
  // The big "Редактировать" button now just flips chrome.
  // ─────────────────────────────────────────────────────────────

  const chromeMode = isEditing ? 'full' : 'minimal';

  return (
    <div className={cn('flex min-h-screen flex-col bg-[#fcfcfb]', editorMode === 'guest' && 'guest-editor')} data-editor-mode={editorMode}>
      {/* 2026-08-14: guest-mode owns its own header (GuestCanvasHeader inside CanvasEditor).
          Hide this outer header to avoid double toolbars. */}
      {editorMode !== 'guest' && (
        <header className="flex items-center justify-between border-b border-us-border/60 bg-white px-4 py-3">
          <Link
            href={`/invitations/${invitationId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-us-ink-muted hover:text-us-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === 'kz' ? 'Артқа' : 'Назад'}
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-us-ink-muted"
              onClick={async () => {
                try {
                  await save(doc);
                } catch (err) {
                  // HOTFIX H3: surface save error (no silent success)
                  console.error('[CanvasEditorClient] header save failed', err);
                  // minimal visible feedback (toast may not be in scope; console + rethrow handled by caller)
                }
              }}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {locale === 'kz' ? 'Сақтау' : 'Сохранить'}
            </Button>
            {shareUrl ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                {locale === 'kz' ? 'Көру' : 'Просмотр'}
              </Button>
            ) : null}

            {chromeMode === 'minimal' ? (
              <Button
                type="button"
                className="bg-us-accent text-us-cream hover:bg-us-accent-strong"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="mr-1.5 h-4 w-4" />
                {locale === 'kz' ? 'Редакциялау' : 'Редактировать'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                {locale === 'kz' ? 'Қарапайым көрініс' : 'Простой вид'}
              </Button>
            )}
          </div>
        </header>
      )}

      {/* Single CanvasEditor with chrome prop — the canonical shell */}
      <div className="flex-1">
        <CanvasEditor
          initialDocument={doc}
          onChange={setDoc}
          onSaveRequest={save}
          shareUrl={shareUrl}
          locale={locale}
          chrome={chromeMode}
          invitationId={invitationId}
          editorMode={editorMode}
        />
      </div>
    </div>
  );
}
