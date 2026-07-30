'use client';

import { useState, useTransition } from 'react';
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
}

export function CanvasEditorClient({ invitationId, initialDocument, shareUrl, locale }: Props) {
  const [doc, setDoc] = useState<InvitationCanvasDocument>(initialDocument);
  const [isEditing, setIsEditing] = useState(false);
  const [, start] = useTransition();

  // 2026-07-30 REVIEW / P0-6 follow-up:
  // We now use ONE CanvasEditor instance with chrome prop.
  // - chrome="minimal" = clean preview + big "Редактировать" button
  // - chrome="full" = palette + inspector + full toolbar
  // Document + history are shared (no unmount loss).
  // This is the honest "one shell" direction.

  const save = async (d: InvitationCanvasDocument) => {
    start(async () => {
      try {
        await fetch(`/api/invitations/${invitationId}/canvas`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ document: d }),
        });
      } catch {
        throw new Error('save_failed');
      }
    });
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
    <div className="flex min-h-screen flex-col bg-[#fcfcfb]">
      {/* Minimal header (always present) */}
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
              } catch {
                /* ignore */
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

      {/* Single CanvasEditor with chrome prop — the canonical shell */}
      <div className="flex-1">
        <CanvasEditor
          initialDocument={doc}
          onChange={setDoc}
          onSaveRequest={save}
          shareUrl={shareUrl}
          locale={locale}
          chrome={chromeMode}
        />
      </div>
    </div>
  );
}
