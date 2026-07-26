'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';
import type { EventType } from '@prisma/client';
import type { InvitationData } from '@/components/invitation-layouts/types';
import { MusicPanel } from '@/components/invitation-layouts/MusicPanel';
import { PublishChecklistModal } from '@/components/publish/PublishChecklistModal';
import { PublishStepper } from '@/components/publish/PublishStepper';
import type { PublishStep } from '@/components/publish/PublishStepper';
import { resolvePublishStep } from '@/lib/invitations/publish-flow';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';
import { useI18n } from '@/i18n';
import { KaspiPanel } from './KaspiPanel';
import { GalleryPanel } from './GalleryPanel';
import { SocialPanel } from './SocialPanel';
import { TextPresetsPanel } from './TextPresetsPanel';
import { GuestsPanel } from './GuestsPanel';
import { SeatingPanel } from './SeatingPanel';
import { AiFillPanel } from './AiFillPanel';
import { BackgroundPanel } from './BackgroundPanel';
import { ToolbarToolButtons, type EditorPanelId } from './ToolbarToolButtons';
import { ToolbarPublishActions } from './ToolbarPublishActions';
import { PostPublishShare } from './PostPublishShare';
import { useGuestHandlers } from './useGuestHandlers';
import type { ConfirmAction, EditorGuestInfo } from './types';
import { subscribeEditorGuidedAction } from './editor-events';
import { EditorOnboarding } from './EditorOnboarding';
import { EditorPanelPortal } from './EditorPanelPortal';
import { FamilyPreviewLink } from './FamilyPreviewLink';
import { useToolbarOffset } from './useToolbarOffset';

export type { EditorGuestInfo } from './types';

export interface EditorToolbarProps {
  invitation: InvitationData;
  invitationId?: string;
  guestCount?: number;
  onUpdateInvitation: (patch: Partial<InvitationData>, newTemplateData?: Record<string, unknown>) => void;
  onAddGuests: (
    guests: Array<{ name: string; phone?: string; side?: 'bride' | 'groom'; hasPlusOne?: boolean }>,
  ) => Promise<{ created: number }>;
  onDeleteGuest?: (guestId: string) => Promise<void>;
  onUpdateGuest?: (guest: {
    id: string;
    name: string;
    phone?: string | null;
    hasPlusOne?: boolean;
    householdLabel?: string | null;
  }) => Promise<void>;
  onPublish: () => Promise<boolean | void>;
  onUnpublish?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onApplyProgramPreset?: () => Promise<void>;
  isPublished: boolean;
  isSaving: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved';
  backHref?: string;
  guestNames?: string[];
  guests?: EditorGuestInfo[];
  isDraft?: boolean;
  publishPriceKzt?: number;
  isLoggedIn?: boolean;
  paymentPending?: boolean;
  widePreview?: boolean;
  onToggleWidePreview?: () => void;
  wizardMode?: boolean;
}

export function EditorToolbar({
  invitation,
  invitationId,
  guestCount = 0,
  onUpdateInvitation,
  onAddGuests,
  onDeleteGuest,
  onUpdateGuest,
  onPublish,
  onUnpublish,
  onArchive,
  onApplyProgramPreset,
  isPublished,
  isSaving,
  saveStatus = 'idle',
  backHref = '/dashboard',
  guestNames = [],
  guests = [],
  isDraft = false,
  publishPriceKzt = 0,
  isLoggedIn = true,
  paymentPending = false,
  widePreview = false,
  onToggleWidePreview,
  wizardMode = false,
}: EditorToolbarProps) {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const publishStep: PublishStep = resolvePublishStep({
    isPublished,
    isLoggedIn,
    needsPayment: publishPriceKzt > 0,
    paymentPending,
    wizardMode,
  });

  const [activePanel, setActivePanel] = useState<EditorPanelId | null>(null);
  const [bgUrl, setBgUrl] = useState(invitation.templateData.backgroundImage || '');
  const [showPublishCheck, setShowPublishCheck] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  useToolbarOffset(toolbarRef);

  const guestHandlers = useGuestHandlers({
    guestNames,
    guests,
    onAddGuests,
    onDeleteGuest,
    onUpdateGuest,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('qazshaqyru:editor-onboarding') !== '1') {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    setBgUrl(invitation.templateData.backgroundImage || '');
  }, [invitation.templateData.backgroundImage]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    return subscribeEditorGuidedAction((action) => {
      if (action.type === 'panel') {
        setActivePanel(action.panel);
        return;
      }
      if (action.type === 'publish') {
        setShowPublishCheck(true);
        return;
      }
      const preview = document.getElementById('editor-preview-frame');
      preview?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const togglePanel = useCallback((panel: EditorPanelId) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const customText = invitation.customText || {};
  const kaspiPhone = typeof customText.kaspiPhone === 'string' ? customText.kaspiPhone : '';
  const instagramUrl = typeof customText.instagramUrl === 'string' ? customText.instagramUrl : '';
  const telegramUrl = typeof customText.telegramUrl === 'string' ? customText.telegramUrl : '';
  const eventType = invitation.eventType as EventType;

  const openRsvp = isOpenRsvpEnabled(customText, eventType);
  const personalLinksMode = !openRsvp;

  function rsvpStatusLabel(status: string | null | undefined): string {
    if (!status || status === 'pending') return t('invitation.guests.rsvpPending');
    if (status === 'attending') return t('invitation.guests.rsvpAttending');
    if (status === 'attending_plus_one') return t('invitation.guests.rsvpAttendingPlusOne');
    if (status === 'attending_no_children') return t('invitation.guests.rsvpAttendingNoChildren');
    if (status === 'not_attending') return t('invitation.guests.rsvpNotAttending');
    return status;
  }

  const doCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/i/${invitation.slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }, [invitation.slug]);

  const copyLink = useCallback(async () => {
    if (personalLinksMode && guestCount === 0) {
      setConfirmAction({ type: 'copyLink' });
      return;
    }
    await doCopyLink();
  }, [personalLinksMode, guestCount, doCopyLink]);

  const handleTemplateChange = useCallback(
    (slug: string) => {
      if (slug === invitation.templateKey) {
        closePanel();
        return;
      }
      setConfirmAction({ type: 'templateChange', slug });
    },
    [invitation.templateKey, closePanel],
  );

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'unpublish' && onUnpublish) {
      await onUnpublish();
    }
    if (confirmAction.type === 'archive' && onArchive) {
      await onArchive();
    }
    if (confirmAction.type === 'copyLink') {
      await doCopyLink();
    }
    if (confirmAction.type === 'templateChange') {
      onUpdateInvitation({ templateKey: confirmAction.slug });
      closePanel();
    }
    setConfirmAction(null);
  }, [confirmAction, onUnpublish, onArchive, doCopyLink, onUpdateInvitation, closePanel]);

  const handleKaspiSave = useCallback(
    (phone: string) => {
      onUpdateInvitation({
        customText: { ...customText, kaspiPhone: phone },
      });
    },
    [customText, onUpdateInvitation],
  );

  const handleSocialSave = useCallback(
    (field: 'instagramUrl' | 'telegramUrl', value: string) => {
      onUpdateInvitation({
        customText: { ...customText, [field]: value },
      });
    },
    [customText, onUpdateInvitation],
  );

  const handleGalleryUpdate = useCallback(
    (key: string, url: string) => {
      const newTemplateData = url
        ? { ...invitation.templateData, [key]: url }
        : (Object.fromEntries(
            Object.entries(invitation.templateData).filter(([k]) => k !== key),
          ) as typeof invitation.templateData);
      onUpdateInvitation({ templateData: newTemplateData }, newTemplateData);
    },
    [invitation.templateData, onUpdateInvitation],
  );

  const handleTextPresetApply = useCallback(
    (greeting: string, closing?: string) => {
      const nextCustomText: Record<string, unknown> = { ...customText, greeting };
      if (closing) {
        nextCustomText.footer = closing;
      }
      onUpdateInvitation({ customText: nextCustomText });
    },
    [customText, onUpdateInvitation],
  );

  const handleBgUpload = useCallback(
    (url: string) => {
      setBgUrl(url);
      const newTemplateData = { ...invitation.templateData, backgroundImage: url };
      onUpdateInvitation({ templateData: newTemplateData }, newTemplateData);
    },
    [invitation.templateData, onUpdateInvitation],
  );

  const handleBgRemove = useCallback(() => {
    setBgUrl('');
    const newTemplateData = Object.fromEntries(
      Object.entries(invitation.templateData).filter(([k]) => k !== 'backgroundImage'),
    ) as typeof invitation.templateData;
    onUpdateInvitation({ templateData: newTemplateData }, newTemplateData);
  }, [invitation.templateData, onUpdateInvitation]);

  const handleToggleOpenRsvp = useCallback(
    (openRsvpValue: boolean) => {
      onUpdateInvitation({
        customText: { ...customText, openRsvp: openRsvpValue },
      });
    },
    [customText, onUpdateInvitation],
  );

  const confirmDialogProps = (() => {
    if (!confirmAction) return null;
    if (confirmAction.type === 'unpublish') {
      return {
        title: t('invitation.edit.unpublishTitle'),
        message: t('common.unpublishConfirm'),
        destructive: true,
      };
    }
    if (confirmAction.type === 'archive') {
      return {
        title: t('invitation.edit.archiveTitle'),
        message: t('common.archiveConfirm'),
        destructive: true,
      };
    }
    if (confirmAction.type === 'copyLink') {
      return {
        title: t('invitation.edit.copyLinkTitle'),
        message: t('invitation.edit.copyLinkNoRsvpHint'),
      };
    }
    return {
      title: t('invitation.edit.toolbarTemplate'),
      message: t('invitation.edit.templateChangeConfirm'),
    };
  })();

  return (
    <div ref={toolbarRef} className="sticky top-0 z-40">
      <div
        className={cn(
          'us-shell-header flex h-16 items-center gap-3 px-4 transition-shadow sm:px-6',
          scrolled && 'shadow-us-md'
        )}
      >
        <Button variant="ghost" size="sm" className="shrink-0 text-us-ink-muted hover:bg-us-accent/6 hover:text-us-accent" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('invitation.edit.backToList')}</span>
          </Link>
        </Button>

        <div className="min-w-0 flex-1" aria-hidden />

        {onToggleWidePreview ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-us-ink-muted hover:bg-us-accent/6 hover:text-us-accent"
            onClick={onToggleWidePreview}
            title={widePreview ? t('invitation.edit.narrowPreview') : t('invitation.edit.widePreview')}
          >
            <Monitor size={16} />
          </Button>
        ) : null}

        <div className="relative flex shrink-0 items-center gap-2">
          {!isPublished && invitationId ? (
            <FamilyPreviewLink invitationId={invitationId} disabled={isSaving} />
          ) : null}
          <ToolbarPublishActions
            isPublished={isPublished}
            isSaving={isSaving}
            saveStatus={saveStatus}
            invitationId={invitationId}
            invitationSlug={invitation.slug}
            invitationTitle={invitation.title}
            guestCount={guestCount}
            openRsvp={openRsvp}
            publishPriceKzt={publishPriceKzt}
            onUnpublish={onUnpublish ? () => setConfirmAction({ type: 'unpublish' }) : undefined}
            onArchive={onArchive ? () => setConfirmAction({ type: 'archive' }) : undefined}
            onPublishClick={() => setShowPublishCheck(true)}
            onCopyLink={copyLink}
          />
        </div>
      </div>

      <div className="border-b border-us-border bg-us-surface">
        <ToolbarToolButtons
          activePanel={activePanel}
          onTogglePanel={togglePanel}
          currentTemplateKey={invitation.templateKey}
          onTemplateSelect={handleTemplateChange}
          guestCount={guestNames.length > 0 ? guestNames.length : guestCount}
          onApplyProgramPreset={onApplyProgramPreset}
        />
      </div>

      {!isPublished ? (
        <div className="space-y-2 border-b border-us-border bg-us-ivory px-4 py-3 sm:px-6">
          <PublishStepper
            current={publishStep}
            needsPayment={publishPriceKzt > 0}
            variant={wizardMode ? 'wizard' : 'full'}
          />
          {publishPriceKzt > 0 ? (
            <p className="font-body text-xs text-us-ink-muted">
              {t('publishFlow.payToGetLink').replace(
                '{price}',
                publishPriceKzt.toLocaleString('ru-RU'),
              )}
            </p>
          ) : null}
        </div>
      ) : null}

      {isPublished ? (
        <PostPublishShare
          invitationSlug={invitation.slug}
          invitationTitle={invitation.title}
          openRsvp={openRsvp}
        />
      ) : null}

      {activePanel === 'background' ? (
        <EditorPanelPortal>
          <BackgroundPanel
            invitationId={invitationId}
            bgUrl={bgUrl}
            onUpload={handleBgUpload}
            onRemove={handleBgRemove}
            onClose={closePanel}
          />
        </EditorPanelPortal>
      ) : null}

      {activePanel === 'gallery' ? (
        <EditorPanelPortal>
          <GalleryPanel
            invitationId={invitationId}
            templateData={invitation.templateData}
            onUpdate={handleGalleryUpdate}
            onClose={closePanel}
          />
        </EditorPanelPortal>
      ) : null}

      {activePanel === 'kaspi' ? (
        <EditorPanelPortal>
          <KaspiPanel kaspiPhone={kaspiPhone} onSave={handleKaspiSave} onClose={closePanel} />
        </EditorPanelPortal>
      ) : null}

      {activePanel === 'social' ? (
        <EditorPanelPortal>
          <SocialPanel
            instagramUrl={instagramUrl}
            telegramUrl={telegramUrl}
            onSave={handleSocialSave}
            onClose={closePanel}
          />
        </EditorPanelPortal>
      ) : null}

      {activePanel === 'presets' ? (
        <EditorPanelPortal>
          <TextPresetsPanel
            eventType={eventType}
            onApply={handleTextPresetApply}
            onClose={closePanel}
          />
        </EditorPanelPortal>
      ) : null}

      {activePanel === 'guests' ? (
        <EditorPanelPortal>
          <GuestsPanel
          displayGuests={guestHandlers.displayGuests}
          personalLinksMode={personalLinksMode}
          openRsvp={openRsvp}
          isDraft={isDraft}
          editingGuestId={guestHandlers.editingGuestId}
          editGuestName={guestHandlers.editGuestName}
          editGuestPhone={guestHandlers.editGuestPhone}
          editGuestHasPlusOne={guestHandlers.editGuestHasPlusOne}
          editGuestHousehold={guestHandlers.editGuestHousehold}
          savingGuestEdit={guestHandlers.savingGuestEdit}
          guestName={guestHandlers.guestName}
          guestPhone={guestHandlers.guestPhone}
          guestHasPlusOne={guestHandlers.guestHasPlusOne}
          guestSide={guestHandlers.guestSide}
          guestHousehold={guestHandlers.guestHousehold}
          showBulkGuests={guestHandlers.showBulkGuests}
          bulkGuestText={guestHandlers.bulkGuestText}
          addingGuests={guestHandlers.addingGuests}
          deletingGuestId={guestHandlers.deletingGuestId}
          onToggleOpenRsvp={handleToggleOpenRsvp}
          onStartEditGuest={guestHandlers.startEditGuest}
          onSaveGuestEdit={guestHandlers.handleSaveGuestEdit}
          onCancelEditGuest={guestHandlers.cancelEditGuest}
          onDeleteGuest={guestHandlers.handleDeleteGuest}
          onToggleBulkGuests={guestHandlers.toggleBulkGuests}
          onBulkAddGuests={guestHandlers.handleBulkAddGuests}
          onAddGuest={guestHandlers.handleAddGuest}
          setEditGuestName={guestHandlers.setEditGuestName}
          setEditGuestPhone={guestHandlers.setEditGuestPhone}
          setEditGuestHasPlusOne={guestHandlers.setEditGuestHasPlusOne}
          setEditGuestHousehold={guestHandlers.setEditGuestHousehold}
          setGuestName={guestHandlers.setGuestName}
          setGuestPhone={guestHandlers.setGuestPhone}
          setGuestHasPlusOne={guestHandlers.setGuestHasPlusOne}
          setGuestSide={guestHandlers.setGuestSide}
          setGuestHousehold={guestHandlers.setGuestHousehold}
          setBulkGuestText={guestHandlers.setBulkGuestText}
          rsvpStatusLabel={rsvpStatusLabel}
          hasUpdateGuest={Boolean(onUpdateGuest)}
          hasDeleteGuest={Boolean(onDeleteGuest)}
          onClose={closePanel}
          />
        </EditorPanelPortal>
      ) : null}

      {activePanel === 'seating' && invitationId ? (
        <EditorPanelPortal>
          <SeatingPanel
            invitationId={invitationId}
            guests={guestHandlers.displayGuests}
            onClose={closePanel}
          />
        </EditorPanelPortal>
      ) : null}

      {activePanel === 'ai' ? (
        <EditorPanelPortal>
          <AiFillPanel
            eventType={invitation.eventType}
            defaultNames={invitation.title}
            onApply={async (data) => {
              const next = { ...customText };
              if (data.bodyRu) next.bodyRu = data.bodyRu;
              if (data.bodyKz) next.bodyKz = data.bodyKz;
              if (data.dressCode) next.dressCode = data.dressCode;
              if (data.greeting) next.greeting = data.greeting;
              if (data.whatsappMessage) next.whatsappMessage = data.whatsappMessage;
              if (data.program) next.program = data.program;
              onUpdateInvitation({ customText: next });
            }}
            onClose={closePanel}
          />
        </EditorPanelPortal>
      ) : null}

      {activePanel === 'music' ? (
        <EditorPanelPortal>
          <MusicPanel
            invitationId={invitationId}
            currentMusicUrl={invitation.musicUrl}
            onSelectMusic={(url) => {
              onUpdateInvitation({ musicUrl: url });
            }}
            onClose={closePanel}
          />
        </EditorPanelPortal>
      ) : null}

      <PublishChecklistModal
        open={showPublishCheck}
        onClose={() => setShowPublishCheck(false)}
        onConfirm={async () => {
          const ok = await onPublish();
          if (ok !== false) setShowPublishCheck(false);
        }}
        title={invitation.title}
        eventDate={invitation.eventDate}
        eventPlace={invitation.eventPlace}
        hasCouplePhoto={Boolean(
          invitation.templateData.couplePhoto1 || invitation.templateData.couplePhoto2,
        )}
        hasProgram={
          Array.isArray(customText.program) && (customText.program as unknown[]).length > 0
        }
        loading={isSaving}
      />

      {confirmDialogProps ? (
        <ConfirmDialog
          open={confirmAction !== null}
          title={confirmDialogProps.title}
          message={confirmDialogProps.message}
          destructive={confirmDialogProps.destructive}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      ) : null}

      {showOnboarding ? (
        <EditorOnboarding
          onDismiss={() => {
            localStorage.setItem('qazshaqyru:editor-onboarding', '1');
            setShowOnboarding(false);
          }}
        />
      ) : null}
    </div>
  );
}
