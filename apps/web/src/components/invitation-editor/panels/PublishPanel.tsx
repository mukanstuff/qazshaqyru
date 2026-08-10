'use client';

/**
 * PublishPanel — slug, publish/unpublish, share.
 */

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useHtmlEditorStore, useHtmlEditorFields, useHtmlEditorUi } from '@/lib/templates/html-engine/editor/store';
import {
  checkSlugAvailabilityAction,
  publishHtmlInvitationAction,
  unpublishHtmlInvitationAction,
} from '@/lib/templates/html-engine/editor/actions';
import { useToast } from '@/components/ui/toaster';
import { Globe, Copy, Check, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { PaneSection, PaneField, SlugInput } from '../primitives';

interface Props {
  isPublished: boolean;
  backHref: string;
}

export function PublishPanel({ isPublished }: Props) {
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();
  const { invitationId } = useHtmlEditorUi();
  const { toast } = useToast();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pendingPublish, startPublishTransition] = useTransition();
  const [pendingUnpublish, startUnpublishTransition] = useTransition();

  const slugValue = fields.slug;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const publicUrl = `${origin}/i/${slugValue}`;

  const checkSlug = useCallback(
    async (slug: string) => {
      try {
        const result = await checkSlugAvailabilityAction(slug, invitationId ?? undefined);
        return {
          available: result.available,
          error: result.available ? undefined : 'Этот адрес уже занят',
        };
      } catch {
        return { available: false, error: 'Не удалось проверить' };
      }
    },
    [invitationId],
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = publicUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Ссылка скопирована' });
  }, [publicUrl, toast]);

  const handlePublish = useCallback(() => {
    if (!invitationId) {
      toast({ title: 'Сначала сохраните приглашение', variant: 'destructive' });
      return;
    }
    startPublishTransition(async () => {
      const result = await publishHtmlInvitationAction({ invitationId });
      if (result.ok) {
        toast({ title: '🎉 Приглашение опубликовано' });
        router.refresh();
      } else {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      }
    });
  }, [invitationId, toast, router]);

  const handleUnpublish = useCallback(() => {
    if (!invitationId) return;
    startUnpublishTransition(async () => {
      const result = await unpublishHtmlInvitationAction({ invitationId });
      if (result.ok) {
        toast({ title: 'Публикация отменена' });
        router.refresh();
      } else {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      }
    });
  }, [invitationId, toast, router]);

  const canPublish = Boolean(
    fields.groomName && fields.brideName && fields.eventDate && invitationId,
  );

  return (
    <div>
      <PaneSection title="Адрес приглашения" hint="Веб-ссылка для гостей">
        <SlugInput
          value={slugValue}
          onChange={(v) => store.updateField('slug', v)}
          origin={origin}
          check={checkSlug}
          initialSlug={slugValue}
          placeholder="aida-daniyar"
        />

        <div className="editor-pane-card">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-white/40" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/60">{publicUrl}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white"
              title="Копировать"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[var(--us-turquoise)]" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white"
              title="Открыть"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <p className="editor-pane-info">
          Разрешены латиница, цифры и дефис. После сохранения ссылка активна.
        </p>
      </PaneSection>

      <PaneSection title="Публикация">
        {isPublished ? (
          <>
            <div
              className="flex items-center gap-2 rounded-xl border p-3"
              style={{
                borderColor: 'color-mix(in srgb, var(--us-turquoise) 30%, transparent)',
                background: 'color-mix(in srgb, var(--us-turquoise) 12%, transparent)',
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--us-turquoise)]/20">
                <Check className="h-4 w-4 text-[var(--us-turquoise)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Опубликовано</p>
                <p className="text-xs text-white/50">Гости видят ваше приглашение</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={pendingUnpublish}
              className="editor-btn editor-btn--ghost editor-btn--block"
            >
              {pendingUnpublish ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Снять с публикации
            </button>
          </>
        ) : (
          <>
            {!canPublish ? (
              <div
                className="flex items-start gap-2 rounded-xl border p-3"
                style={{
                  borderColor: 'color-mix(in srgb, var(--us-peach) 30%, transparent)',
                  background: 'color-mix(in srgb, var(--us-peach) 12%, transparent)',
                }}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 pt-0.5 text-[var(--us-peach)]" />
                <p className="text-xs text-white/70">
                  Заполните имена и дату во вкладке «Содержание», затем сохраните.
                </p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish || pendingPublish}
              className="editor-btn editor-btn--primary editor-btn--block editor-btn--lg"
            >
              {pendingPublish ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {pendingPublish ? 'Публикация…' : 'Опубликовать'}
            </button>
          </>
        )}
      </PaneSection>

      {isPublished ? (
        <PaneSection title="Поделиться">
          <button
            type="button"
            onClick={handleCopyLink}
            className="editor-btn editor-btn--ghost editor-btn--block"
          >
            <Copy className="h-4 w-4" />
            Скопировать ссылку
          </button>
          <p className="editor-pane-info">
            Скопируйте ссылку и отправьте гостям в WhatsApp или Telegram.
          </p>
        </PaneSection>
      ) : null}
    </div>
  );
}