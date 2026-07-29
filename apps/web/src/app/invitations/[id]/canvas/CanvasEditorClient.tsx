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

  /* ── Simple (preview) mode ── */
  if (!isEditing) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fcfcfb]">
        {/* Minimal header */}
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
          </div>
        </header>

        {/* Clean centered preview */}
        <div className="flex flex-1 items-start justify-center overflow-auto px-4 py-8">
          <div className="w-full max-w-[390px]">
            <div className="overflow-hidden rounded-xl border border-us-border/60 bg-white shadow-lg">
              <CanvasRenderer
                document={doc}
                mode="guest"
                selectedId={null}
                onSelect={() => {}}
                forceAnimations={false}
                shareUrl={shareUrl}
                locale={locale}
              />
            </div>
          </div>
        </div>

        {/* Center "Edit" button */}
        <footer className="sticky bottom-0 border-t border-us-border/60 bg-white/95 px-4 py-4 backdrop-blur-sm">
          <div className="mx-auto max-w-sm">
            <Button
              type="button"
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-full',
                'bg-us-accent text-us-cream hover:bg-us-accent-strong',
                'min-h-12 text-base font-semibold shadow-lg',
              )}
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="h-5 w-5" />
              {locale === 'kz' ? 'Редакциялау' : 'Редактировать'}
            </Button>
          </div>
        </footer>
      </div>
    );
  }

  /* ── Full editor mode ── */
  return (
    <div className="flex h-screen flex-col">
      {/* Back-to-simple button */}
      <div className="absolute left-3 top-3 z-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 text-us-ink-muted backdrop-blur-sm hover:text-us-accent"
          onClick={() => setIsEditing(false)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {locale === 'kz' ? 'Қарапайым көрініс' : 'Простой вид'}
        </Button>
      </div>

      <CanvasEditor
        initialDocument={doc}
        onChange={setDoc}
        onSaveRequest={save}
        shareUrl={shareUrl}
        locale={locale}
      />
    </div>
  );
}
