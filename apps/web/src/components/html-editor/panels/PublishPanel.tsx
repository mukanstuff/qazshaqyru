'use client';

/**
 * PublishPanel — final tab: slug, publish/unpublish, and share.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHtmlEditorStore, useHtmlEditorFields, useHtmlEditorUi } from '@/lib/templates/html-engine/editor/store';
import {
  checkSlugAvailabilityAction,
  publishHtmlInvitationAction,
  unpublishHtmlInvitationAction,
} from '@/lib/templates/html-engine/editor/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Copy, Check, ExternalLink, AlertTriangle, Loader2, Share2 } from 'lucide-react';
import { cn } from '@/lib/shared/utils';
import { slugSchema } from '@/lib/templates/html-engine/editor/schemas';
import { useToast } from '@/components/ui/toaster';

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-white/30">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-body text-sm text-white/80">{label}</Label>
      {children}
      {hint ? <p className="font-body text-xs text-white/30">{hint}</p> : null}
    </div>
  );
}

interface Props {
  isPublished: boolean;
  slug: string;
  backHref: string;
}

export function PublishPanel({ isPublished, slug: initialSlug }: Props) {
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();
  const { invitationId } = useHtmlEditorUi();
  const { toast } = useToast();
  const router = useRouter();

  const [slugValue, setSlugValue] = useState(initialSlug || fields.slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugChecked, setSlugChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Sync slug from store
  useEffect(() => {
    setSlugValue(fields.slug || initialSlug);
  }, [fields.slug, initialSlug]);

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/i/${slugValue}`;

  const handleSlugChange = useCallback(async (value: string) => {
    setSlugValue(value);
    setSlugChecked(false);

    // Basic format validation
    const result = slugSchema.safeParse(value);
    if (!result.success) {
      setSlugError(result.error.issues[0]?.message ?? 'Неверный формат');
      return;
    }
    setSlugError(null);

    // Check availability (debounced via effect below)
  }, []);

  // Debounced availability check
  useEffect(() => {
    if (!slugValue || slugValue === initialSlug || slugError) return;
    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const result = await checkSlugAvailabilityAction(slugValue, invitationId ?? undefined);
        if (!result.available) {
          setSlugError('Этот адрес уже занят');
        } else {
          setSlugError(null);
          setSlugChecked(true);
        }
      } catch {
        setSlugError('Не удалось проверить');
      } finally {
        setSlugChecking(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [slugValue, initialSlug, slugError, invitationId]);

  const handleSaveSlug = useCallback(async () => {
    if (slugError || !slugValue) return;
    store.updateField('slug', slugValue);
    store.markSaved({ ...fields, slug: slugValue } as Parameters<typeof store.markSaved>[0]);
    setSlugChecked(true);
    toast({ title: 'Адрес сохранён' });
  }, [slugError, slugValue, store, fields, toast]);

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
  }, [publicUrl]);

  const handlePublish = useCallback(async () => {
    if (!invitationId) {
      toast({ title: 'Сначала сохраните приглашение', variant: 'destructive' });
      return;
    }
    setPublishing(true);
    try {
      const result = await publishHtmlInvitationAction({ invitationId });
      if (result.ok) {
        toast({ title: 'Приглашение опубликовано!' });
        router.refresh();
      } else {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      }
    } finally {
      setPublishing(false);
    }
  }, [invitationId, toast, router]);

  const handleUnpublish = useCallback(async () => {
    if (!invitationId) return;
    setPublishing(true);
    try {
      const result = await unpublishHtmlInvitationAction({ invitationId });
      if (result.ok) {
        toast({ title: 'Публикация отменена' });
        router.refresh();
      } else {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      }
    } finally {
      setPublishing(false);
    }
  }, [invitationId, toast, router]);

  const canPublish = Boolean(
    fields.groomName && fields.brideName && fields.eventDate && invitationId
  );

  return (
    <div className="space-y-8 p-5">
      {/* ── URL slug ─────────────────────────────────────────────── */}
      <Section title="Адрес приглашения">
        <Field
          label="Имя ссылки"
          hint="Разрешены только латинские буквы, цифры и дефис."
        >
          <div className="space-y-2">
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5">
              <span className="shrink-0 px-3 font-mono text-sm text-white/40">
                {typeof window !== 'undefined' ? window.location.origin : ''}/i/
              </span>
              <input
                type="text"
                value={slugValue}
                onChange={(e) => handleSlugChange(e.target.value)}
                onBlur={handleSaveSlug}
                className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 font-mono text-sm text-white outline-none placeholder:text-white/20"
                placeholder="aida-daniyar"
                maxLength={80}
              />
              {(slugChecking || slugChecked) && !slugError ? (
                <span className="shrink-0 pr-3">
                  {slugChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                  ) : (
                    <Check className="h-4 w-4 text-[#16A34A]" />
                  )}
                </span>
              ) : null}
            </div>
            {slugError ? (
              <p className="flex items-center gap-1 font-body text-xs text-[#F97316]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {slugError}
              </p>
            ) : null}
          </div>
        </Field>

        {/* Preview link */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <Globe className="h-4 w-4 shrink-0 text-white/30" />
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/60">{publicUrl}</span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:border-white/20 hover:text-white"
            title="Копировать"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:border-white/20 hover:text-white"
            title="Открыть"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </Section>

      {/* ── Publish ──────────────────────────────────────────────── */}
      <Section title="Публикация">
        {isPublished ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A]/20">
                <Check className="h-4 w-4 text-[#16A34A]" />
              </div>
              <div>
                <p className="font-body text-sm font-medium text-white">Опубликовано</p>
                <p className="font-body text-xs text-white/50">
                  Гости видят ваше приглашение
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={handleUnpublish}
              disabled={publishing}
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Снять с публикации
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {!canPublish ? (
              <div className="flex items-start gap-2 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4">
                <AlertTriangle className="h-4 w-4 shrink-0 pt-0.5 text-[#F59E0B]" />
                <p className="font-body text-xs text-white/70">
                  Заполните имена и дату во вкладке «Содержание», затем сохраните приглашение.
                </p>
              </div>
            ) : null}
            <Button
              variant="default"
              size="lg"
              className="w-full gap-2"
              onClick={handlePublish}
              disabled={!canPublish || publishing}
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              {publishing ? 'Публикация…' : 'Опубликовать'}
            </Button>
          </div>
        )}
      </Section>

      {/* ── Share ───────────────────────────────────────────────── */}
      {isPublished && (
        <Section title="Поделиться">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={handleCopyLink}
            >
              <Share2 className="h-4 w-4" />
              Скопировать ссылку
            </Button>
          </div>
          <p className="font-body text-xs text-white/30">
            Скопируйте ссылку и отправьте гостям в WhatsApp или Telegram.
          </p>
        </Section>
      )}
    </div>
  );
}
