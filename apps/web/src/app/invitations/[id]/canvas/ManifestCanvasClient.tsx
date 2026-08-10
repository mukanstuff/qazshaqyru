'use client';

import { ArrowLeft, Edit3, Eye, Save } from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InvitationLayoutRouter } from '@/components/invitation-layouts/LayoutRouter';
import type { InvitationData } from '@/components/invitation-layouts/types';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';

interface Props {
  invitationId: string;
  initialInvitation: InvitationData;
  shareUrl: string;
  locale: 'ru' | 'kz';
}

/**
 * Editor shell for manifest-based templates (e.g. wedding-luxury).
 *
 * Rendering uses the same InvitationLayoutRouter that powers /preview/[slug]
 * and the public /i/[slug] page, so what the owner sees in /canvas exactly
 * matches the published guest view. Inline editing of fields is provided
 * via LayoutRouter's own isEditing=true + EditorToolbar path.
 */
export function ManifestCanvasClient({ invitationId, initialInvitation, shareUrl, locale }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<InvitationData>(initialInvitation);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(
    async (field: string, value: string) => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/invitations/${invitationId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`save_failed: ${res.status} ${text}`);
        }
        // Optimistic update for fields that survive revalidation
        setInvitation((prev) => {
          if (field.startsWith('customText.')) {
            const key = field.replace('customText.', '');
            return {
              ...prev,
              customText: { ...(prev.customText ?? {}), [key]: value },
            };
          }
          if (field.startsWith('templateData.')) {
            const key = field.replace('templateData.', '');
            return {
              ...prev,
              templateData: { ...prev.templateData, [key]: value },
            };
          }
          return { ...prev, [field]: value } as InvitationData;
        });
        router.refresh();
      } catch (err) {
        console.error('[ManifestCanvasClient] save failed', err);
        toast({
          title: t('invitation.editorToasts.saveFailed'),
          description: t('invitation.editorToasts.saveFailedHint'),
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [invitationId, router, toast, t],
  );

  const handleTemplateChange = useCallback(
    async (templateKey: string) => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/invitations/${invitationId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ templateKey }),
        });
        if (!res.ok) throw new Error(`template_change_failed: ${res.status}`);
        setInvitation((prev) => ({ ...prev, templateKey }));
        router.refresh();
      } catch (err) {
        console.error('[ManifestCanvasClient] template change failed', err);
        toast({
          title: t('invitation.editorToasts.designSaveFailed'),
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [invitationId, router, toast, t],
  );

  const handleSaveDesign = useCallback(
    async (templateKey: string, templateData: Record<string, unknown>) => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/invitations/${invitationId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ templateKey, templateData }),
        });
        if (!res.ok) throw new Error(`design_save_failed: ${res.status}`);
        setInvitation((prev) => ({ ...prev, templateKey, templateData: { ...prev.templateData, ...templateData } }));
        router.refresh();
      } catch (err) {
        console.error('[ManifestCanvasClient] design save failed', err);
        toast({
          title: t('invitation.editorToasts.designSaveFailed'),
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [invitationId, router, toast, t],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfcfb]">
      <header className="flex items-center justify-between border-b border-us-border/60 bg-white px-4 py-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-us-ink-muted hover:text-us-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === 'kz' ? 'Артқа' : 'Назад'}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-us-ink-muted">
            {isSaving
              ? locale === 'kz' ? 'Сақталуда…' : 'Сохранение…'
              : locale === 'kz' ? 'Дайын' : 'Готово'}
          </span>
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
          {isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {locale === 'kz' ? 'Дайын' : 'Готово'}
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-us-accent text-us-cream hover:bg-us-accent-strong"
              onClick={() => setIsEditing(true)}
              data-testid="canvas-edit-button"
            >
              <Edit3 className="mr-1.5 h-4 w-4" />
              {locale === 'kz' ? 'Редакциялау' : 'Редактировать'}
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1">
        <InvitationLayoutRouter
          slug={invitation.slug}
          guestToken={null}
          familyToken={null}
          demoLayout={invitation.templateKey}
          isEditing={isEditing}
          initialInvitation={invitation}
          onFieldChange={save}
          onTemplateChange={handleTemplateChange}
          onSaveDesign={handleSaveDesign}
          onPublish={async () => {
            // Publish is handled by the dashboard CTA; this is a no-op for /canvas.
          }}
          backHref="/dashboard"
          invitationId={invitationId}
          isDraft
          isPublished={false}
          wizardMode={false}
          suppressGuestChrome
          previewChrome="framed"
        />
      </div>
    </div>
  );
}