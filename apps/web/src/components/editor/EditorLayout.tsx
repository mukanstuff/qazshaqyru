'use client';

/**
 * @deprecated Legacy editor shell — unrouted. Do not revive as second product path.
 * Legacy editor: `/invitations/edit` redirects to QuickWizard or canvas.
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { InvitationData } from '@/components/invitation-layouts/types';
import { parseCustomTextFieldValue } from '@/components/invitation-layouts/types';
import type { InvitationForEditor } from '@/components/editor/EditorLayout.types';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { getTemplateManifest } from '@/lib/templates/manifests';
import {
  updateInvitationDetailsAction,
  updateInvitationDesignAction,
  updateInvitationContentAction,
  unpublishInvitationAction,
  archiveInvitationAction,
  addGuestsAction,
  deleteGuestAction,
  updateGuestAction,
} from '@/lib/invitations/actions';
import { useInvitationPublish } from '@/hooks/use-invitation-publish';
import { PaymentStatusBanner } from '@/components/orders/PaymentStatusBanner';
import { PaymentPendingBanner } from '@/components/dashboard/PaymentPendingBanner';
import { EditorGuidedFlow } from '@/components/editor/EditorGuidedFlow';
import { EditorPreview } from '@/components/editor/EditorPreview';
import { EditorPreviewWatermark } from '@/components/editor/EditorPreviewWatermark';
import { FamilyPreviewCard } from '@/components/editor/FamilyPreviewCard';
import { PostPublishShareScreen } from '@/components/editor/PostPublishShareScreen';
import { EditorWorkspaceShell } from '@/components/editor/EditorWorkspaceShell';
import { Card, CardContent } from '@/components/ui/card';
import { clearDraft } from '@/lib/invitations/draft-storage';
import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';
import {
  documentToInvitationData,
  documentToInvitationForEditor,
  invitationForEditorToDocument,
} from '@/lib/invitations/document';
import { useInvitationEditorStore } from '@/lib/invitations/editor-store';

function withoutCustomBackground(templateData: Record<string, unknown>): Record<string, unknown> {
  const next = { ...templateData };
  delete next.backgroundImage;
  return next;
}

export type { InvitationForEditor } from '@/components/editor/EditorLayout.types';

type EventType =
  | 'wedding'
  | 'toy'
  | 'birthday'
  | 'corporate'
  | 'anniversary'
  | 'betashar'
  | 'kyz_uzatu'
  | 'other';

interface Props {
  invitation: InvitationForEditor;
  isPublished?: boolean;
  priceKzt?: number;
  guestsTotal?: number;
  showPublishedBanner?: boolean;
  showPaymentFailed?: boolean;
  showPaymentInvalid?: boolean;
  showPaymentPending?: boolean;
  wizardMode?: boolean;
  justPublished?: boolean;
}

export function EditorLayout({
  invitation: initialInvitation,
  isPublished = false,
  priceKzt = 0,
  guestsTotal,
  showPublishedBanner = false,
  showPaymentFailed = false,
  showPaymentInvalid = false,
  showPaymentPending = false,
  wizardMode = false,
  justPublished = false,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [widePreview, setWidePreview] = useState(false);
  const [dismissPaymentBanner, setDismissPaymentBanner] = useState(false);
  const [showPostPublish, setShowPostPublish] = useState(justPublished);
  const editorStore = useInvitationEditorStore(invitationForEditorToDocument(initialInvitation));
  const editorState = useMemo(
    () => documentToInvitationForEditor(editorStore.document, initialInvitation),
    [editorStore.document, initialInvitation],
  );
  const { handlePublish, isPublishing, setIsPublishing } = useInvitationPublish(editorState.id);
  const serverIdRef = useRef(initialInvitation.id);
  const draftRef = useRef(initialInvitation);
  draftRef.current = editorState;

  const [guestNames, setGuestNames] = useState(() => initialInvitation.guests.map((g) => g.name));
  const [editorGuests, setEditorGuests] = useState(() =>
    initialInvitation.guests.map((g) => ({
      id: g.id,
      name: g.name,
      phone: g.phone,
      side: g.side ?? null,
      hasPlusOne: g.hasPlusOne,
      householdLabel: g.householdLabel ?? null,
      responseStatus: g.responseStatus ?? null,
      sentAt: g.sentAt ?? null,
    })),
  );

  useEffect(() => {
    if (justPublished) {
      setShowPostPublish(true);
    }
  }, [justPublished]);

  useEffect(() => {
    if (showPublishedBanner) {
      clearDraft();
    }
  }, [showPublishedBanner]);

  useEffect(() => {
    if (initialInvitation.id !== serverIdRef.current) {
      serverIdRef.current = initialInvitation.id;
      editorStore.actions.loadDocument(
        invitationForEditorToDocument(initialInvitation),
        initialInvitation.status === 'published' ? 'PUBLISHED' : 'SYNCED_ACCOUNT',
      );
      setGuestNames(initialInvitation.guests.map((g) => g.name));
      setEditorGuests(
        initialInvitation.guests.map((g) => ({
          id: g.id,
          name: g.name,
          phone: g.phone,
          side: g.side ?? null,
          hasPlusOne: g.hasPlusOne,
          householdLabel: g.householdLabel ?? null,
          responseStatus: g.responseStatus ?? null,
          sentAt: g.sentAt ?? null,
        })),
      );
    }
  }, [editorStore.actions, initialInvitation]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const t = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  const patchDraft = useCallback((patch: Partial<InvitationForEditor>) => {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    editorStore.actions.loadDocument(
      invitationForEditorToDocument(next),
      next.status === 'published' ? 'PUBLISHED' : 'SYNCED_ACCOUNT',
    );
  }, [editorStore.actions]);

  const handleFieldSave = useCallback(async (field: string, value: string) => {
    const draft = draftRef.current;
    setSaveStatus('saving');
    try {
      if (
        ['title', 'eventDate', 'eventTime', 'eventPlace', 'eventType', 'address', 'mapUrl', 'musicUrl'].includes(
          field,
        )
      ) {
        const next = {
          title: field === 'title' ? value : draft.title,
          eventType: (field === 'eventType' ? value : draft.eventType) as EventType,
          eventDate: field === 'eventDate' ? value : draft.eventDate,
          eventTime: field === 'eventTime' ? value || null : draft.eventTime || null,
          eventPlace: field === 'eventPlace' ? value || null : draft.eventPlace || null,
          address: field === 'address' ? value || null : draft.address || null,
          mapUrl: field === 'mapUrl' ? value || null : draft.mapUrl || null,
          musicUrl: field === 'musicUrl' ? value || null : draft.musicUrl || null,
        };
        await updateInvitationDetailsAction({ id: draft.id, ...next });
        patchDraft(next);
      } else if (field.startsWith('customText.')) {
        const key = field.replace('customText.', '');
        const fieldValue = parseCustomTextFieldValue(key, value);
        const newCustom = { ...(draft.customText || {}), [key]: fieldValue };
        await updateInvitationContentAction({
          id: draft.id,
          customText: newCustom as Record<string, unknown>,
        });
        patchDraft({ customText: newCustom });
      } else if (field.startsWith('templateData.')) {
        const key = field.replace('templateData.', '');
        const newData = { ...(draft.templateData || {}), [key]: value };
        await updateInvitationDesignAction({
          id: draft.id,
          templateKey: draft.templateKey,
          templateData: newData as Record<string, unknown>,
        });
        patchDraft({ templateData: newData });
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('idle');
      toast({
        title: t('invitation.editorToasts.saveFailed'),
        description: t('invitation.editorToasts.saveFailedHint'),
        variant: 'destructive',
      });
    }
  }, [patchDraft, toast, t]);

  const handleTemplateChange = useCallback(
    async (templateKey: string) => {
      const draft = draftRef.current;
      const templateData = withoutCustomBackground(draft.templateData as Record<string, unknown>);
      setSaveStatus('saving');
      try {
        await updateInvitationDesignAction({
          id: draft.id,
          templateKey,
          templateData,
        });
        patchDraft({ templateKey, templateData });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
        toast({
          title: t('invitation.editorToasts.designSaveFailed'),
          description: t('invitation.editorToasts.saveFailedHint'),
          variant: 'destructive',
        });
      }
    },
    [patchDraft, toast, t],
  );

  const handleSaveDesign = useCallback(
    async (templateKey: string, templateData: Record<string, unknown>) => {
      const draft = draftRef.current;
      setSaveStatus('saving');
      try {
        await updateInvitationDesignAction({
          id: draft.id,
          templateKey,
          templateData,
        });
        patchDraft({ templateKey, templateData });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
        toast({
          title: t('invitation.editorToasts.designSaveFailed'),
          description: t('invitation.editorToasts.saveFailedHint'),
          variant: 'destructive',
        });
      }
    },
    [patchDraft, toast, t],
  );

  const handleUnpublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      await unpublishInvitationAction(draftRef.current.id);
      router.refresh();
      toast({
        title: t('invitation.editorToasts.unpublishSuccess'),
        description: t('invitation.editorToasts.unpublishHint'),
      });
    } catch {
      toast({
        title: t('invitation.editorToasts.unpublishFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  }, [router, setIsPublishing, toast, t]);

  const handleArchive = useCallback(async () => {
    setIsPublishing(true);
    try {
      await archiveInvitationAction(draftRef.current.id);
      router.push('/dashboard');
    } catch {
      toast({
        title: t('invitation.editorToasts.archiveFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  }, [router, setIsPublishing, toast, t]);

  const handleAddGuests = useCallback(
    async (
      guests: Array<{
        name: string;
        phone?: string;
        side?: 'bride' | 'groom';
        hasPlusOne?: boolean;
        householdLabel?: string;
      }>
    ) => {
      const result = await addGuestsAction({
        invitationId: draftRef.current.id,
        guests: guests.map((g) => ({
          name: g.name,
          phone: g.phone,
          side: g.side,
          hasPlusOne: g.hasPlusOne ?? false,
          householdLabel: g.householdLabel,
        })),
      });
      const newEntries = result.guests.map((g, i) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        side: guests[i]?.side ?? null,
        hasPlusOne: guests[i]?.hasPlusOne ?? false,
        householdLabel: guests[i]?.householdLabel ?? null,
        responseStatus: null as string | null,
        sentAt: null as string | null,
      }));
      setGuestNames((prev) => [...prev, ...guests.map((g) => g.name)]);
      setEditorGuests((prev) => {
        const nextGuests = [...prev, ...newEntries];
        editorStore.actions.setGuests(
          nextGuests.map((item) => ({
            id: item.id ?? '',
            name: item.name,
            phone: item.phone ?? null,
            side: item.side ?? null,
            hasPlusOne: item.hasPlusOne ?? false,
            householdLabel: item.householdLabel ?? null,
            responseStatus: item.responseStatus ?? null,
            sentAt: item.sentAt ?? null,
          })),
        );
        return nextGuests;
      });
      return { created: result.created };
    },
    [editorStore.actions],
  );

  const handleUpdateGuest = useCallback(
    async (guest: {
      id: string;
      name: string;
      phone?: string | null;
      hasPlusOne?: boolean;
      householdLabel?: string | null;
    }) => {
      await updateGuestAction({
        guestId: guest.id,
        name: guest.name,
        phone: guest.phone ?? null,
        ...(guest.hasPlusOne !== undefined ? { hasPlusOne: guest.hasPlusOne } : {}),
        ...(guest.householdLabel !== undefined
          ? { householdLabel: guest.householdLabel }
          : {}),
      });
      setEditorGuests((prev) => {
        const old = prev.find((g) => g.id === guest.id);
        if (old) {
          setGuestNames((names) => names.map((n) => (n === old.name ? guest.name : n)));
        }
        const nextGuests = prev.map((g) =>
          g.id === guest.id
            ? {
                ...g,
                name: guest.name,
                phone: guest.phone ?? null,
                hasPlusOne: guest.hasPlusOne ?? g.hasPlusOne,
                householdLabel:
                  guest.householdLabel !== undefined
                    ? guest.householdLabel
                    : g.householdLabel,
              }
            : g,
        );
        editorStore.actions.setGuests(
          nextGuests.map((item) => ({
            id: item.id ?? '',
            name: item.name,
            phone: item.phone ?? null,
            side: item.side ?? null,
            hasPlusOne: item.hasPlusOne ?? false,
            householdLabel: item.householdLabel ?? null,
            responseStatus: item.responseStatus ?? null,
            sentAt: item.sentAt ?? null,
          })),
        );
        return nextGuests;
      });
      router.refresh();
      toast({ title: t('invitation.editorToasts.guestUpdated') });
    },
    [editorStore.actions, router, toast, t],
  );

  const handleDeleteGuest = useCallback(
    async (guestId: string) => {
      const removed = editorGuests.find((g) => g.id === guestId);
      await deleteGuestAction(guestId);
      setEditorGuests((prev) => {
        const nextGuests = prev.filter((g) => g.id !== guestId);
        editorStore.actions.setGuests(
          nextGuests.map((item) => ({
            id: item.id ?? '',
            name: item.name,
            phone: item.phone ?? null,
            side: item.side ?? null,
            hasPlusOne: item.hasPlusOne ?? false,
            householdLabel: item.householdLabel ?? null,
            responseStatus: item.responseStatus ?? null,
            sentAt: item.sentAt ?? null,
          })),
        );
        return nextGuests;
      });
      if (removed) {
        setGuestNames((names) => names.filter((name) => name !== removed.name));
      }
      router.refresh();
      toast({ title: t('invitation.editorToasts.guestDeleted') });
    },
    [editorGuests, editorStore.actions, router, toast, t],
  );

  const invitationData: InvitationData = useMemo(
    () => documentToInvitationData(editorStore.document),
    [editorStore.document],
  );
  const openRsvp = isOpenRsvpEnabled(editorState.customText, editorState.eventType as EventType);
  const hasManifestTemplate = Boolean(getTemplateManifest(editorState.templateKey));

  const dismissPostPublish = useCallback(() => {
    setShowPostPublish(false);
    router.replace(`/invitations/${editorState.id}`, { scroll: false });
  }, [router, editorState.id]);

  return (
    <EditorWorkspaceShell
      banner={
        <>
          {showPublishedBanner && !showPostPublish && (
            <PaymentStatusBanner variant="published" />
          )}
          {!dismissPaymentBanner && showPaymentFailed && (
            <PaymentStatusBanner variant="failed" onDismiss={() => setDismissPaymentBanner(true)} />
          )}
          {!dismissPaymentBanner && showPaymentInvalid && (
            <PaymentStatusBanner variant="invalid" onDismiss={() => setDismissPaymentBanner(true)} />
          )}
          {showPaymentPending && <PaymentPendingBanner initialPending alwaysPoll />}
        </>
      }
    >
      <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
        <aside className="us-editor-chrome order-first w-full shrink-0 space-y-4 border-b p-4 backdrop-blur-sm lg:order-none lg:w-80 lg:border-b-0 lg:border-r">
          <EditorGuidedFlow
            title={editorState.title}
            eventDate={editorState.eventDate}
            eventPlace={editorState.eventPlace}
            guestsCount={editorGuests.length}
            isPublished={isPublished}
          />
          <Card className="shadow-us-sm">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-1">
              <div>
                <span className="us-overline block">{t('landing.templatesTitle')}</span>
                <strong className="font-body text-sm text-us-ink">{editorState.templateKey}</strong>
              </div>
              <div>
                <span className="us-overline block">{t('guidedFlow.stepGuests')}</span>
                <strong className="font-body text-sm text-us-ink">
                  {guestsTotal ?? editorGuests.length}
                </strong>
              </div>
              <div>
                <span className="us-overline block">{t('guidedFlow.stepPublish')}</span>
                <strong className="font-body text-sm text-us-ink">
                  {isPublished ? t('dashboard.status.published') : t('dashboard.status.draft')}
                </strong>
              </div>
            </CardContent>
          </Card>
          <FamilyPreviewCard invitationId={editorState.id} />
          {hasManifestTemplate ? (
            <Button variant="outline" className="w-full" asChild>
              <Link
                href={`/invitations/edit?template=${encodeURIComponent(editorState.templateKey)}&invitationId=${editorState.id}`}
              >
                {t('invitation.edit.editContent')}
              </Link>
            </Button>
          ) : null}
        </aside>

        <div
          id="editor-preview-frame"
          className={`editor-scroll-surface relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[var(--us-ivory)] ${widePreview ? '' : 'lg:flex lg:justify-center lg:p-6'}`}
        >
          <EditorPreviewWatermark show={!isPublished} needsPayment={priceKzt > 0 && !isPublished} />
          <div className={widePreview ? 'w-full' : 'w-full max-w-editor'}>
            <EditorPreview
              slug={editorState.slug}
              guestToken={null}
              initialInvitation={invitationData}
              onFieldChange={handleFieldSave}
              onTemplateChange={handleTemplateChange}
              onSaveDesign={handleSaveDesign}
              onPublish={async () => {
                await handlePublish();
              }}
              onUnpublish={handleUnpublish}
              onArchive={handleArchive}
              onAddGuests={handleAddGuests}
              onDeleteGuest={handleDeleteGuest}
              onUpdateGuest={handleUpdateGuest}
              isPublished={isPublished}
              isSaving={saveStatus === 'saving' || isPublishing}
              saveStatus={saveStatus}
              backHref="/dashboard"
              guestNames={guestNames}
              guests={editorGuests}
              invitationId={editorState.id}
              guestCount={guestsTotal ?? editorState.guests.length}
              publishPriceKzt={priceKzt}
              isLoggedIn
              paymentPending={showPaymentPending}
              widePreview={widePreview}
              onToggleWidePreview={() => setWidePreview((v) => !v)}
              wizardMode={wizardMode}
              suppressGuestChrome
              previewChrome={widePreview ? 'wide' : 'framed'}
            />
          </div>
        </div>
      </div>

      {showPostPublish && isPublished ? (
        <PostPublishShareScreen
          invitationId={editorState.id}
          invitationSlug={editorState.slug}
          invitationTitle={editorState.title}
          guestCount={guestsTotal ?? editorGuests.length}
          openRsvp={openRsvp}
          onDismiss={dismissPostPublish}
        />
      ) : null}
    </EditorWorkspaceShell>
  );
}
