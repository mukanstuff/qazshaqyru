'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';
import { SuretRenderer } from '@/components/suret/SuretRenderer';
import type { SuretTemplateManifest } from '@/lib/templates/manifest-types';
import {
  readSuretSlots,
  withSuretSlots,
} from '@/lib/templates/suret-resolve';
import type { InvitationData } from '@/components/invitation-layouts/types';

interface Props {
  manifest: SuretTemplateManifest;
  templateId: string;
  editInvitation?: InvitationData;
  isPublished?: boolean;
}

function defaultSlots(manifest: SuretTemplateManifest, locale: 'ru' | 'kz') {
  const map: Record<string, string> = {};
  for (const slot of manifest.texts) {
    map[slot.id] = locale === 'kz' ? slot.defaultText.kk : slot.defaultText.ru;
  }
  return map;
}

/**
 * Production Suret editor: slots → templateData.suretSlots, publish freemium, PNG export.
 * Designer owns bg.webp; this only wires slots.
 */
export function SuretEditorPage({
  manifest,
  templateId,
  editInvitation,
  isPublished = false,
}: Props) {
  const { locale, t } = useI18n();
  const loc = locale === 'kz' ? 'kz' : 'ru';
  const router = useRouter();
  const { toast } = useToast();

  const initialSlots = useMemo(() => {
    if (editInvitation) {
      const saved = readSuretSlots(editInvitation.templateData);
      if (Object.keys(saved).length > 0) return saved;
    }
    return defaultSlots(manifest, loc);
  }, [editInvitation, manifest, loc]);

  const [slots, setSlots] = useState(initialSlots);
  const [title, setTitle] = useState(editInvitation?.title ?? 'Сүрет шақыру');
  const [invitationId, setInvitationId] = useState(editInvitation?.id ?? null);
  const [slug, setSlug] = useState(editInvitation?.slug ?? null);
  const [published, setPublished] = useState(isPublished);
  const [busy, setBusy] = useState(false);

  const save = useCallback(async () => {
    setBusy(true);
    try {
      const templateData = withSuretSlots({}, slots);
      if (!invitationId) {
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + 30);
        const res = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: title.trim() || 'Сүрет шақыру',
            eventType: 'kyz_uzatu',
            eventDate: eventDate.toISOString(),
            eventTimezone: 'Asia/Almaty',
            templateId,
            templateKey: manifest.slug,
            templateData,
          }),
        });
        const json = (await res.json()) as {
          invitation?: { id: string; slug: string };
          message?: string;
        };
        if (!res.ok || !json.invitation) {
          throw new Error(json.message || 'Create failed');
        }
        setInvitationId(json.invitation.id);
        setSlug(json.invitation.slug);
        router.replace(
          `/invitations/edit?template=${encodeURIComponent(manifest.slug)}&invitationId=${json.invitation.id}`,
        );
        toast({ title: loc === 'kz' ? 'Сақталды' : 'Сохранено' });
        return;
      }

      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim(), templateData }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message || 'Save failed');
      }
      toast({ title: loc === 'kz' ? 'Сақталды' : 'Сохранено' });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }, [invitationId, slots, title, templateId, manifest.slug, router, toast, loc, t]);

  const publish = useCallback(async () => {
    if (!invitationId) {
      await save();
      return;
    }
    setBusy(true);
    try {
      await save();
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'published' }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message || 'Publish failed');
      }
      setPublished(true);
      toast({
        title:
          loc === 'kz'
            ? 'Жарияланды (сервис белгісімен)'
            : 'Опубликовано (бесплатно с логотипом)',
      });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }, [invitationId, save, toast, loc, t]);

  return (
    <div className="us-atmosphere min-h-screen" data-testid="suret-editor-page">
      <header className="us-shell-header sticky top-0 z-20">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/templates">
              <ArrowLeft className="h-4 w-4" />
              {loc === 'kz' ? 'Каталог' : 'Каталог'}
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void save()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loc === 'kz' ? 'Сақтау' : 'Сохранить'}
            </Button>
            {!published ? (
              <Button type="button" size="sm" disabled={busy} onClick={() => void publish()}>
                {loc === 'kz' ? 'Жариялау' : 'Опубликовать'}
              </Button>
            ) : slug ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/i/${slug}`} target="_blank">
                  /i/{slug}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-3xl gap-8 px-4 py-8 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-us-ink-muted">
              {loc === 'kz' ? 'Сүрет · қыз ұзату' : 'Сүрет · қыз ұзату'}
            </p>
            <h1 className="font-display text-2xl text-us-ink">
              {loc === 'kz' ? 'Фото-шақыру' : 'Фото-приглашение'}
            </h1>
            <p className="mt-1 text-sm text-us-ink-muted">
              {loc === 'kz'
                ? 'Ат пен күнді жазыңыз → PNG жүктеңіз → Stories-қа жіберіңіз.'
                : 'Впишите имена и дату → скачайте PNG → отправьте в Stories.'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="suret-title">{loc === 'kz' ? 'Атауы' : 'Название'}</Label>
            <Input
              id="suret-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <SuretRenderer
          manifest={manifest}
          locale={loc}
          editable
          initialSlots={slots}
          onSlotsChange={setSlots}
        />
      </div>
    </div>
  );
}
