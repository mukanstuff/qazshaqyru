'use client';

/**
 * @deprecated Legacy draft editor — unrouted. Do not revive as second product path.
 * Live Editor: `/invitations/edit` + `LiveEditorPage`.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { EditorPreview } from '@/components/editor/EditorPreview';
import { parseCustomTextFieldValue } from '@/components/invitation-layouts/types';
import { LoginModal } from '@/components/auth/LoginModal';
import { useToast } from '@/components/ui/toaster';
import {
  loadDraft,
  saveDraft,
  clearDraft,
  eventTypeFromTemplateKey,
  draftHasMeaningfulContent,
  type LocalDraft,
} from '@/lib/invitations/draft-storage';
import { addGuestsAction } from '@/lib/invitations/actions';
import { checkoutInvitationClient } from '@/lib/payments/checkout-client';
import { syncDraftToServer } from '@/lib/invitations/draft-sync-client';
import { EditorGuidedFlow } from '@/components/editor/EditorGuidedFlow';
import { EditorPreviewWatermark } from '@/components/editor/EditorPreviewWatermark';
import { FamilyPreviewCard } from '@/components/editor/FamilyPreviewCard';
import { EditorWorkspaceShell } from '@/components/editor/EditorWorkspaceShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { nanoid } from 'nanoid';
import { useI18n } from '@/i18n';
import {
  documentToInvitationData,
  localDraftToDocument,
} from '@/lib/invitations/document';
import { useInvitationEditorStore } from '@/lib/invitations/editor-store';

interface Props {
  templateKey: string;
  templateId: string;
  templateName?: string;
  priceKzt: number;
}

export function DraftEditorLayout({ templateKey, templateId, templateName, priceKzt }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [draft, setDraft] = useState<LocalDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSavingToServer, setIsSavingToServer] = useState(false);
  const draftRef = useRef<LocalDraft | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [seedDocument, setSeedDocument] = useState(() =>
    localDraftToDocument({
      templateKey,
      templateId,
      title: templateName || 'Моё приглашение',
      eventType: eventTypeFromTemplateKey(templateKey),
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: null,
      eventPlace: null,
      address: null,
      mapUrl: null,
      musicUrl: null,
      templateData: {},
      customText: {},
      guests: [],
      eventTimezone: 'Asia/Almaty',
      language: 'ru',
      updatedAt: new Date().toISOString(),
    }),
  );
  const editorStore = useInvitationEditorStore(seedDocument);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const t = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const stored = loadDraft();
      if (stored && stored.templateKey !== templateKey && draftHasMeaningfulContent(stored)) {
        const keep = window.confirm(t('common.templateSwitchConfirm'));
        if (keep) {
          router.replace(`/invitations/new?template=${encodeURIComponent(stored.templateKey)}`);
          return;
        }
        clearDraft();
      }

      const storedAfterCheck = loadDraft();
      if (storedAfterCheck && storedAfterCheck.templateKey === templateKey) {
        const normalized: LocalDraft = {
          ...storedAfterCheck,
          guests: storedAfterCheck.guests.map((g) => ({
            ...g,
            localId: g.localId || nanoid(8),
          })),
        };
        if (!cancelled) {
          draftRef.current = normalized;
          setDraft(normalized);
          const document = localDraftToDocument(normalized);
          setSeedDocument(document);
          editorStore.actions.loadDocument(document);
          if (normalized !== storedAfterCheck) saveDraft(normalized);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/invitations/public/demo?layout=${encodeURIComponent(templateKey)}`);
        const data = await res.json();
        if (!res.ok || !data.invitation) throw new Error('load failed');

        const inv = data.invitation;
        const fresh: LocalDraft = {
          templateKey,
          templateId,
          title: templateName || inv.title,
          eventType: eventTypeFromTemplateKey(templateKey),
          eventDate: inv.eventDate,
          eventTime: inv.eventTime ?? null,
          eventPlace: inv.eventPlace ?? null,
          address: inv.address ?? null,
          mapUrl: inv.mapUrl ?? null,
          musicUrl: inv.musicUrl ?? null,
          templateData: inv.templateData || {},
          customText: inv.customText || {},
          guests: [],
          eventTimezone: inv.eventTimezone || 'Asia/Almaty',
          language: inv.language || 'ru',
          updatedAt: new Date().toISOString(),
        };

        if (!cancelled) {
          draftRef.current = fresh;
          setDraft(fresh);
          const document = localDraftToDocument(fresh);
          setSeedDocument(document);
          editorStore.actions.loadDocument(document);
          saveDraft(fresh);
        }
      } catch {
        const fallback: LocalDraft = {
          templateKey,
          templateId,
          title: templateName || 'Моё приглашение',
          eventType: eventTypeFromTemplateKey(templateKey),
          eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          eventTime: null,
          eventPlace: null,
          address: null,
          mapUrl: null,
          musicUrl: null,
          templateData: {},
          customText: {},
          guests: [],
          eventTimezone: 'Asia/Almaty',
          language: 'ru',
          updatedAt: new Date().toISOString(),
        };
        if (!cancelled) {
          draftRef.current = fallback;
          setDraft(fallback);
          const document = localDraftToDocument(fallback);
          setSeedDocument(document);
          editorStore.actions.loadDocument(document);
          saveDraft(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [editorStore.actions, router, t, templateId, templateKey, templateName]);

  useEffect(() => {
    void fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => setIsLoggedIn(Boolean(data.user)))
      .catch(() => setIsLoggedIn(false));
  }, [showLogin]);

  const saveToAccount = useCallback(async (options?: { silent?: boolean }) => {
    const current = draftRef.current;
    if (!current) return;

    const sessionRes = await fetch('/api/auth/session');
    const sessionData = await sessionRes.json();
    if (!sessionData.user) {
      if (!options?.silent) setShowLogin(true);
      return;
    }

    setIsSavingToServer(true);
    try {
      const result = await syncDraftToServer(current);
      const next = {
        ...current,
        serverInvitationId: result.serverInvitationId,
        guests: result.guests ?? current.guests,
      };
      draftRef.current = next;
      setDraft(next);
      saveDraft(next);
      if (!options?.silent) {
        toast({ title: t('common.draftSavedToAccount') });
      }
    } catch (err) {
      if (!options?.silent) {
        toast({
          title: t('common.error'),
          description: err instanceof Error ? err.message : t('errors.tryAgain'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsSavingToServer(false);
    }
  }, [toast, t]);

  useEffect(() => {
    if (!isLoggedIn || !draft) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      void saveToAccount({ silent: true });
    }, 45000);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [draft, isLoggedIn, saveToAccount]);

  const persistLocal = useCallback((patch: Partial<LocalDraft>) => {
    const current = draftRef.current;
    if (!current) return;
    const next = { ...current, ...patch };
    draftRef.current = next;
    setDraft(next);
    editorStore.actions.loadDocument(localDraftToDocument(next), 'LOCAL_DRAFT');
    saveDraft(next);
    setSaveStatus('saved');
  }, [editorStore.actions]);

  const handleFieldSave = useCallback(
    async (field: string, value: string) => {
      const current = draftRef.current;
      if (!current) return;
      setSaveStatus('saving');

      if (field.startsWith('customText.')) {
        const key = field.replace('customText.', '');
        const fieldValue = parseCustomTextFieldValue(key, value);
        persistLocal({ customText: { ...current.customText, [key]: fieldValue } });
      } else if (field.startsWith('templateData.')) {
        const key = field.replace('templateData.', '');
        persistLocal({ templateData: { ...current.templateData, [key]: value } });
      } else if (field === 'musicUrl') {
        persistLocal({ musicUrl: value || null });
      } else {
        persistLocal({ [field]: value } as Partial<LocalDraft>);
      }
    },
    [persistLocal],
  );

  const handleTemplateChange = useCallback(
    async (newKey: string) => {
      let nextTemplateId = draftRef.current?.templateId ?? templateId;
      try {
        const res = await fetch('/api/templates');
        if (res.ok) {
          const data = await res.json();
          const match = data.templates?.find((t: { slug: string; id: string }) => t.slug === newKey);
          if (match?.id) nextTemplateId = match.id;
        }
      } catch {
        // keep previous templateId
      }
      const prevData = (draftRef.current?.templateData ?? {}) as Record<string, unknown>;
      const { backgroundImage: _removed, ...templateData } = prevData;
      persistLocal({ templateKey: newKey, templateId: nextTemplateId, templateData });
    },
    [persistLocal, templateId],
  );

  const handleSaveDesign = useCallback(
    async (newKey: string, templateData: Record<string, unknown>) => {
      persistLocal({ templateKey: newKey, templateData });
    },
    [persistLocal],
  );

  const publishDraft = useCallback(async () => {
    const current = draftRef.current;
    if (!current) return;

    setIsPublishing(true);
    try {
      let invitationId = current.serverInvitationId;

      if (invitationId) {
        const patchRes = await fetch(`/api/invitations/${invitationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: current.templateId ?? templateId,
            templateKey: current.templateKey,
            title: current.title,
            eventType: current.eventType,
            eventDate: current.eventDate,
            eventTime: current.eventTime || undefined,
            eventPlace: current.eventPlace || undefined,
            address: current.address || undefined,
            mapUrl: current.mapUrl || undefined,
            musicUrl: current.musicUrl || undefined,
            templateData: current.templateData,
            customText: current.customText,
            eventTimezone: current.eventTimezone,
          }),
        });
        if (!patchRes.ok) {
          const data = await patchRes.json().catch(() => ({}));
          throw new Error(data.message || 'Не удалось сохранить приглашение');
        }
      } else {
        const createRes = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: current.templateId ?? templateId,
            templateKey: current.templateKey,
            title: current.title,
            eventType: current.eventType,
            eventDate: current.eventDate,
            eventTime: current.eventTime || undefined,
            eventPlace: current.eventPlace || undefined,
            address: current.address || undefined,
            mapUrl: current.mapUrl || undefined,
            musicUrl: current.musicUrl || undefined,
            templateData: current.templateData,
            customText: current.customText,
            eventTimezone: current.eventTimezone,
          }),
        });

        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({}));
          throw new Error(data.message || 'Не удалось сохранить приглашение');
        }

        const { invitation } = await createRes.json();
        invitationId = invitation.id;
      }

      if (!invitationId) {
        throw new Error('Не удалось сохранить приглашение');
      }

      if (current.guests.some((g) => !g.serverGuestId)) {
        const unsynced = current.guests.filter((g) => !g.serverGuestId);
        const guestResult = await addGuestsAction({
          invitationId,
          guests: unsynced.map((g) => ({
            name: g.name,
            phone: g.phone,
            hasPlusOne: g.hasPlusOne ?? false,
          })),
        });
        const byPhone = new Map(guestResult.guests.filter((g) => g.phone).map((g) => [g.phone!, g.id]));
        const byName = new Map(
          guestResult.guests.map((g) => [g.name.trim().toLowerCase(), g.id])
        );
        const mergedGuests = current.guests.map((g) => {
          if (g.serverGuestId) return g;
          const id = (g.phone && byPhone.get(g.phone)) || byName.get(g.name.trim().toLowerCase());
          return id ? { ...g, serverGuestId: id } : g;
        });
        draftRef.current = { ...current, serverInvitationId: invitationId, guests: mergedGuests };
        saveDraft(draftRef.current);
      }

      // 2026-07-30 P0-1: explicit intent:'pay' (default changed, but be explicit for user path)
      const checkout = await checkoutInvitationClient(invitationId, { intent: 'pay' });

      if (checkout.published) {
        clearDraft();
        router.replace(`/invitations/${invitationId}?published=1`);
        return;
      }

      if (checkout.paymentUrl) {
        const withServerId = { ...current, serverInvitationId: invitationId };
        draftRef.current = withServerId;
        saveDraft(withServerId);
        window.location.href = checkout.paymentUrl;
        return;
      }

      if (checkout.needsPayment) {
        const withServerId = { ...current, serverInvitationId: invitationId };
        draftRef.current = withServerId;
        saveDraft(withServerId);
        router.replace(`/invitations/${invitationId}?payment=pending`);
        return;
      }

      throw new Error(t('invitation.editorToasts.publishFailed'));
    } catch (err) {
      toast({
        title: t('invitation.editorToasts.publishFailed'),
        description: err instanceof Error ? err.message : t('errors.tryAgain'),
        variant: 'destructive',
      });
      setSaveStatus('idle');
    } finally {
      setIsPublishing(false);
    }
  }, [router, templateId, toast, t]);

  const handlePublish = useCallback(async () => {
    const sessionRes = await fetch('/api/auth/session');
    const sessionData = await sessionRes.json();

    if (sessionData.user) {
      await publishDraft();
    } else {
      setShowLogin(true);
    }
  }, [publishDraft]);

  const handleLoginSuccess = useCallback(async () => {
    await publishDraft();
  }, [publishDraft]);

  const handleAddGuests = useCallback(
    async (guests: Array<{ name: string; phone?: string; hasPlusOne?: boolean }>) => {
      const current = draftRef.current;
      if (!current) return { created: 0 };
      const nextGuests = [
        ...current.guests,
        ...guests
          .filter((g) => g.name.trim())
          .map((g) => ({
            localId: nanoid(8),
            name: g.name.trim(),
            phone: g.phone,
            hasPlusOne: g.hasPlusOne ?? false,
          })),
      ];
      persistLocal({ guests: nextGuests });
      return { created: guests.length };
    },
    [persistLocal],
  );

  const handleUpdateGuest = useCallback(
    async (guest: { id: string; name: string; phone?: string | null; hasPlusOne?: boolean }) => {
      const current = draftRef.current;
      if (!current) return;
      persistLocal({
        guests: current.guests.map((g) =>
          g.localId === guest.id
            ? {
                ...g,
                name: guest.name,
                phone: guest.phone ?? undefined,
                hasPlusOne: guest.hasPlusOne ?? g.hasPlusOne,
              }
            : g
        ),
      });
    },
    [persistLocal],
  );

  const handleDeleteGuest = useCallback(
    async (guestId: string) => {
      const current = draftRef.current;
      if (!current) return;
      persistLocal({
        guests: current.guests.filter((g) => g.localId !== guestId),
      });
    },
    [persistLocal],
  );

  if (loading || !draft) {
    return (
      <EditorWorkspaceShell contained>
        <div className="flex min-h-[60vh] items-center justify-center py-12">
          <Card className="shadow-us-md">
            <CardContent className="p-8 text-center">
              <p className="font-body text-sm text-us-ink-muted">{t('common.loading')}</p>
            </CardContent>
          </Card>
        </div>
      </EditorWorkspaceShell>
    );
  }

  return (
    <>
      <EditorWorkspaceShell>
        <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
          <aside className="order-first w-full shrink-0 space-y-4 border-b border-us-border p-4 lg:order-none lg:w-80 lg:border-b-0 lg:border-r">
            <EditorGuidedFlow
              title={draft.title}
              eventDate={draft.eventDate}
              eventPlace={draft.eventPlace}
              guestsCount={draft.guests.length}
              isPublished={false}
            />
            <FamilyPreviewCard invitationId={draft.serverInvitationId} disabled={isSavingToServer} />
            <div className="rounded-md border border-us-cta/30 bg-us-cta/5 px-3 py-2 font-body text-xs text-us-ink-muted">
              {t('common.draftStorageWarning')}
            </div>
            <Button
              type="button"
              variant="default"
              className="w-full"
              onClick={() => void saveToAccount()}
              disabled={isSavingToServer}
            >
              {isSavingToServer ? t('common.saving') : t('common.saveToAccount')}
            </Button>
          </aside>

          <div
            id="editor-preview-frame"
            className="relative min-w-0 flex-1 bg-us-ivory/50 lg:flex lg:justify-center lg:p-6"
          >
            <EditorPreviewWatermark show needsPayment={priceKzt > 0} />
            <div className="w-full max-w-editor">
              <EditorPreview
              slug="draft"
              guestToken={null}
              initialInvitation={documentToInvitationData(editorStore.document)}
              onFieldChange={handleFieldSave}
              onTemplateChange={handleTemplateChange}
              onSaveDesign={handleSaveDesign}
              onPublish={handlePublish}
              onAddGuests={handleAddGuests}
              onDeleteGuest={handleDeleteGuest}
              onUpdateGuest={handleUpdateGuest}
              isPublished={false}
              isSaving={saveStatus === 'saving' || isPublishing}
              saveStatus={saveStatus}
              backHref="/templates"
              guestNames={draft.guests.map((g) => g.name)}
              guests={draft.guests.map((g) => ({
                id: g.localId,
                name: g.name,
                phone: g.phone ?? null,
                hasPlusOne: g.hasPlusOne ?? false,
              }))}
              invitationId={draft.serverInvitationId}
              isDraft
              publishPriceKzt={priceKzt}
              isLoggedIn={isLoggedIn}
            />
            </div>
          </div>
        </div>
      </EditorWorkspaceShell>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => void handleLoginSuccess()}
        title={t('auth.publishLoginTitle')}
        subtitle={t('auth.publishLoginSubtitle')}
      />
    </>
  );
}
