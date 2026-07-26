'use client';

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { ChevronUp, Layers } from 'lucide-react';
import { LoginModal } from '@/components/auth/LoginModal';
import { InvitationLayoutRouter } from '@/components/invitation-layouts/LayoutRouter';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';
import type { InvitationData } from '@/components/invitation-layouts/types';
import {
  documentToInvitationData,
  documentToLocalDraft,
  invitationForEditorToDocument,
  type InvitationDocument,
} from '@/lib/invitations/document';
import { useInvitationEditorStore } from '@/lib/invitations/editor-store';
import { loadDraft, saveDraft } from '@/lib/invitations/draft-storage';
import { syncDraftToServer } from '@/lib/invitations/draft-sync-client';
import { checkoutInvitationClient } from '@/lib/payments/checkout-client';
import {
  computeReadiness,
  stepToSectionType,
  type EditorStepId,
} from '@/lib/invitations/editor-readiness';
import { readFieldValue } from '@/lib/invitations/editor-section-fields';
import { instantiateInvitationDocument } from '@/lib/templates/instantiate-document';
import { getTemplateManifest } from '@/lib/templates/manifests';
import type { InvitationForEditor } from '@/components/editor/EditorLayout.types';
import { cn } from '@/lib/shared/utils';
import { LiveEditorShell } from './LiveEditorShell';
import { LiveEditorTopBar } from './LiveEditorTopBar';
import { LiveEditorContextBar } from './LiveEditorContextBar';
import { LiveEditorTextTools } from './LiveEditorTextTools';
import { LiveEditorSheet } from './LiveEditorSheet';
import { LiveEditorFieldsSheetBody } from './LiveEditorFieldsSheetBody';
import { LiveEditorSectionsSheetBody } from './LiveEditorSectionsSheetBody';
import { LiveEditorPhonePreview } from './LiveEditorPhonePreview';
import { LiveEditorInspector } from './LiveEditorInspector';
import { LiveEditorBottomNav, type MobileNavTab } from './LiveEditorBottomNav';
import {
  LiveEditorPreviewModeSwitch,
  type PreviewMode,
} from './LiveEditorPreviewModeSwitch';
import { LiveEditorPublishConfidence } from './LiveEditorPublishConfidence';
import { LiveEditorGuidedStart } from './LiveEditorGuidedStart';
import { LiveEditorStepRail } from './LiveEditorStepRail';
import { LiveEditorProgressBadge } from './LiveEditorProgressBadge';
import { LiveEditorNextCard } from './LiveEditorNextCard';
import { resolveTapEditTarget } from '@/lib/live-editor/tap-edit';

interface Props {
  templateKey: string;
  templateId: string;
  templateName: string;
  editInvitation?: InvitationData;
  isPublished?: boolean;
}

type SheetId = 'fields' | 'sections' | 'inspector' | null;

const GUIDED_STORAGE_KEY = 'shaqyru.live-editor.guided-v1';

function invitationDataToEditorShape(
  invitation: InvitationData,
  status: string,
): InvitationForEditor {
  return {
    id: invitation.id,
    slug: invitation.slug,
    status,
    title: invitation.title,
    eventType: invitation.eventType,
    eventDate: invitation.eventDate,
    eventTime: invitation.eventTime ?? null,
    eventPlace: invitation.eventPlace ?? null,
    address: invitation.address ?? null,
    mapUrl: invitation.mapUrl ?? null,
    musicUrl: invitation.musicUrl ?? null,
    templateKey: invitation.templateKey,
    templateData: invitation.templateData as Record<string, unknown>,
    customText: (invitation.customText ?? {}) as Record<string, unknown>,
    guests: [],
    eventTimezone: invitation.eventTimezone,
    language: invitation.language,
    hostName: invitation.hostName ?? null,
    isPast: invitation.isPast,
  };
}

function buildInitialDocument(
  templateKey: string,
  templateId: string,
  locale: 'kz' | 'ru',
  editInvitation?: InvitationData,
  isPublished?: boolean,
): InvitationDocument {
  if (editInvitation) {
    return invitationForEditorToDocument(
      invitationDataToEditorShape(editInvitation, isPublished ? 'published' : 'draft'),
    );
  }
  const manifest = getTemplateManifest(templateKey);
  if (!manifest) {
    throw new Error(`Missing manifest for ${templateKey}`);
  }
  return instantiateInvitationDocument(manifest, {
    templateId,
    locale,
  });
}

function pickImageFile(onUrl: (url: string) => void) {
  const el = window.document.createElement('input');
  el.type = 'file';
  el.accept = 'image/*';
  el.onchange = () => {
    const file = el.files?.[0];
    if (!file) return;
    onUrl(URL.createObjectURL(file));
  };
  el.click();
}

function shouldShowGuided(isEditMode: boolean): boolean {
  if (isEditMode) return false;
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(GUIDED_STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}

function markGuidedDone() {
  try {
    window.sessionStorage.setItem(GUIDED_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function LiveEditorPage({
  templateKey,
  templateId,
  templateName,
  editInvitation,
  isPublished = false,
}: Props) {
  const { toast } = useToast();
  const { locale, t } = useI18n();
  const isEditMode = Boolean(editInvitation);

  const initialDocument = useMemo(
    () =>
      buildInitialDocument(
        templateKey,
        templateId,
        locale === 'kz' ? 'kz' : 'ru',
        editInvitation,
        isPublished,
      ),
    // seed once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { document, actions } = useInvitationEditorStore(initialDocument);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('phone');
  const [mobileTab, setMobileTab] = useState<MobileNavTab>('edit');
  const [activeStepId, setActiveStepId] = useState<EditorStepId | null>('basics');
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [serverInvitationId, setServerInvitationId] = useState<string | undefined>(
    editInvitation?.id !== 'draft' ? editInvitation?.id : undefined,
  );

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (data?.user) setIsLoggedIn(true);
      })
      .catch(() => {
        /* guest draft mode */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEditMode) {
      setGuidedOpen(false);
      return;
    }
    setGuidedOpen(shouldShowGuided(false));
  }, [isEditMode]);

  const invitationPreview = useMemo(() => documentToInvitationData(document), [document]);
  const sortedSections = useMemo(
    () => [...document.sections].sort((a, b) => a.order - b.order),
    [document.sections],
  );
  const readiness = useMemo(
    () => computeReadiness(document, locale === 'kz' ? 'kz' : 'ru'),
    [document, locale],
  );
  const readinessLabel = t('liveEditor.readinessReady', {
    done: readiness.completedSteps,
    total: readiness.totalSteps,
  });
  const defaultActiveSectionId = useMemo(() => {
    const hideable = sortedSections.find((s) => s.canHide && s.visible);
    return hideable?.id ?? sortedSections[0]?.id ?? null;
  }, [sortedSections]);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const resolvedActiveId = activeSectionId ?? defaultActiveSectionId;
  const activeSection = sortedSections.find((s) => s.id === resolvedActiveId) ?? null;

  const isGuestPreview = previewMode === 'guest' || mobileTab === 'preview';
  const isEditingPreview = !isGuestPreview;

  useEffect(() => {
    const root = window.document.querySelector('[data-testid="live-editor-preview"]');
    if (!root) return;
    root.querySelectorAll('[data-section]').forEach((el) => {
      el.classList.remove('le-section--active');
    });
    if (!activeSection || isGuestPreview) return;
    const match =
      root.querySelector(`[data-section="${activeSection.type}"]`) ??
      root.querySelector(`[data-section="${activeSection.id}"]`);
    match?.classList.add('le-section--active');
  }, [activeSection, invitationPreview, isGuestPreview, previewMode]);

  const selectSectionByTypeOrId = useCallback(
    (typeOrId: string) => {
      const byType = sortedSections.find((s) => s.type === typeOrId && s.visible);
      const byId = sortedSections.find((s) => s.id === typeOrId);
      const next = byType ?? byId;
      if (!next) return;
      setActiveSectionId(next.id);
      const step = readiness.steps.find((s) => stepToSectionType(s.id) === next.type);
      if (step) setActiveStepId(step.id);
      setMobileTab('edit');
      if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1100px)').matches) {
        setSheet('inspector');
      }
    },
    [readiness.steps, sortedSections],
  );

  const handleStageClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (isGuestPreview) return;
      const { sectionKey, fieldKey } = resolveTapEditTarget(event.target);
      if (fieldKey && event.target instanceof HTMLElement) {
        const interactive = event.target.closest(
          'input, textarea, button, a, select, label, [contenteditable="true"]',
        );
        // Inline EditableField (role=button) handles itself; still select section for inspector sync.
        if (interactive && interactive.getAttribute('role') !== 'button') return;
      } else if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          'input, textarea, button, a, select, label, [contenteditable="true"], [role="textbox"]',
        )
      ) {
        return;
      }
      if (!sectionKey) return;
      selectSectionByTypeOrId(sectionKey);
      if (fieldKey) {
        window.requestAnimationFrame(() => {
          const focusEl =
            (window.document.querySelector(
              `[data-inspector-field="${CSS.escape(fieldKey)}"]`,
            ) as HTMLElement | null) ??
            (window.document.querySelector(
              `[data-edit-field="${CSS.escape(fieldKey)}"]`,
            ) as HTMLElement | null);
          focusEl?.focus();
        });
      }
    },
    [isGuestPreview, selectSectionByTypeOrId],
  );

  const handleFieldSave = useCallback(
    async (field: string, value: string) => {
      let nextValue = value;
      if (field === 'eventDate' && value && !value.includes('T')) {
        nextValue = new Date(`${value}T12:00:00`).toISOString();
      }
      actions.updateField(field, nextValue);
      if (field === 'customText.groomName' || field === 'customText.brideName') {
        const groom =
          field === 'customText.groomName'
            ? nextValue
            : String(document.customText.groomName ?? '');
        const bride =
          field === 'customText.brideName'
            ? nextValue
            : String(document.customText.brideName ?? '');
        const title = [bride, groom].filter(Boolean).join(' & ') || templateName;
        actions.setMeta({ title });
      }
    },
    [actions, document.customText.brideName, document.customText.groomName, templateName],
  );

  const handlePhotoSave = useCallback(
    async (photoKey: string, url: string) => {
      const path = photoKey.startsWith('templateData.')
        ? photoKey
        : `templateData.${photoKey}`;
      actions.updateField(path, url);
    },
    [actions],
  );

  const pickCover = useCallback(() => {
    pickImageFile((url) => void handlePhotoSave('coverPhoto', url));
  }, [handlePhotoSave]);

  const pickPhotoForPath = useCallback(
    (path: string) => {
      pickImageFile((url) => void handleFieldSave(path, url));
    },
    [handleFieldSave],
  );

  const persistLocal = useCallback(() => {
    const previous = loadDraft();
    const draft = documentToLocalDraft(document, previous);
    if (serverInvitationId) {
      draft.serverInvitationId = serverInvitationId;
    }
    if (!draft.templateId) draft.templateId = templateId;
    saveDraft(draft);
    return draft;
  }, [document, serverInvitationId, templateId]);

  const handleSave = useCallback(async (): Promise<string | undefined> => {
    setIsSaving(true);
    try {
      const draft = persistLocal();
      if (!isLoggedIn) {
        toast({ title: 'Черновик сохранён локально' });
        setShowLogin(true);
        return undefined;
      }
      const result = await syncDraftToServer(draft);
      setServerInvitationId(result.serverInvitationId);
      actions.setMeta({ id: result.serverInvitationId, slug: result.serverInvitationId });
      toast({ title: 'Сохранено' });
      return result.serverInvitationId;
    } catch {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
      return undefined;
    } finally {
      setIsSaving(false);
    }
  }, [actions, isLoggedIn, persistLocal, toast]);

  const handlePublishConfirm = useCallback(async () => {
    setIsPublishing(true);
    try {
      const id = serverInvitationId ?? (await handleSave());
      if (!id) {
        toast({ title: 'Сначала сохраните и войдите', variant: 'destructive' });
        return;
      }
      const checkout = await checkoutInvitationClient(id);
      if (checkout.needsPayment && checkout.paymentUrl) {
        window.location.href = checkout.paymentUrl;
        return;
      }
      if (checkout.published) {
        actions.setMeta({ status: 'published', slug: checkout.slug || id });
        setShowPublish(false);
        window.location.href = `/invitations/${encodeURIComponent(id)}?published=1`;
        return;
      }
      toast({ title: checkout.message || 'Публикация недоступна', variant: 'destructive' });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Не удалось опубликовать',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  }, [actions, handleSave, serverInvitationId, toast]);

  const handleShare = useCallback(async () => {
    const href = serverInvitationId
      ? `${window.location.origin}/i/${encodeURIComponent(
          invitationPreview.slug === 'draft' ? serverInvitationId : invitationPreview.slug,
        )}`
      : null;
    if (!href) {
      toast({ title: 'Сначала сохраните приглашение' });
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: document.meta.title, url: href });
        return;
      }
      await navigator.clipboard.writeText(href);
      toast({ title: 'Ссылка скопирована' });
    } catch {
      toast({ title: 'Не удалось поделиться', variant: 'destructive' });
    }
  }, [document.meta.title, invitationPreview.slug, serverInvitationId, toast]);

  const handleSelectStep = useCallback(
    (stepId: EditorStepId) => {
      setActiveStepId(stepId);
      if (stepId === 'publish') {
        setShowPublish(true);
        return;
      }
      const sectionType = stepToSectionType(stepId);
      if (sectionType) selectSectionByTypeOrId(sectionType);
    },
    [selectSectionByTypeOrId],
  );

  const handleMobileNav = useCallback((tab: MobileNavTab) => {
    setMobileTab(tab);
    if (tab === 'preview') {
      setPreviewMode('guest');
      setSheet(null);
      return;
    }
    setPreviewMode('phone');
    setSheet('inspector');
  }, []);

  const handlePrimaryNavAction = useCallback(() => {
    if (readiness.readinessScore >= 100) {
      setShowPublish(true);
      setMobileTab('edit');
      return;
    }
    const next = readiness.nextAction;
    if (next?.stepId) {
      handleSelectStep(next.stepId);
      setSheet('inspector');
      setMobileTab('edit');
      return;
    }
    setSheet('inspector');
    setMobileTab('edit');
  }, [handleSelectStep, readiness.nextAction, readiness.readinessScore]);

  const applyGuidedValues = useCallback(
    (values: {
      groomName: string;
      brideName: string;
      eventDate: string;
      eventTime: string;
      eventPlace: string;
      coverPhoto: string;
    }) => {
      if (values.groomName) void handleFieldSave('customText.groomName', values.groomName);
      if (values.brideName) void handleFieldSave('customText.brideName', values.brideName);
      if (values.eventDate) {
        const iso = new Date(`${values.eventDate}T12:00:00`).toISOString();
        void handleFieldSave('eventDate', iso);
      }
      if (values.eventTime) void handleFieldSave('eventTime', values.eventTime);
      if (values.eventPlace) void handleFieldSave('eventPlace', values.eventPlace);
      if (values.coverPhoto) void handleFieldSave('templateData.coverPhoto', values.coverPhoto);
      markGuidedDone();
      setGuidedOpen(false);
    },
    [handleFieldSave],
  );

  const previewHref = serverInvitationId
    ? `/i/${encodeURIComponent(invitationPreview.slug === 'draft' ? serverInvitationId : invitationPreview.slug)}`
    : null;

  const manifest = getTemplateManifest(document.meta.templateKey);

  if (!manifest) {
    return (
      <LiveEditorShell className="items-center justify-center p-6" data-testid="live-editor">
        <p>Шаблон не найден</p>
      </LiveEditorShell>
    );
  }

  const inspectorBody = (
    <>
      <LiveEditorInspector
        sectionType={activeSection?.type ?? null}
        sectionId={activeSection?.id ?? null}
        document={document}
        onFieldChange={(path, value) => void handleFieldSave(path, value)}
        onPhotoPick={pickPhotoForPath}
      />
      <div className="live-editor-inspector__tools">
        <LiveEditorTextTools
          eventType={document.meta.eventType || 'wedding'}
          defaultNames={document.meta.title || templateName}
          onFieldChange={(path, value) => void handleFieldSave(path, value)}
        />
      </div>
    </>
  );

  return (
    <LiveEditorShell data-testid="live-editor">
      <LiveEditorTopBar
        title={document.meta.title || templateName}
        subtitle={templateName}
        backHref="/templates"
        isSaving={isSaving}
        isPublishing={isPublishing}
        readinessLabel={readinessLabel}
        readinessScore={readiness.readinessScore}
        previewHref={previewHref}
        isPublished={isPublished || document.meta.status === 'published'}
        onSave={() => void handleSave()}
        onPublish={() => setShowPublish(true)}
        onShare={() => void handleShare()}
        progressSlot={
          <LiveEditorProgressBadge
            completed={readiness.completedSteps}
            total={readiness.totalSteps}
            label={readinessLabel}
            onClick={() => {
              if (readiness.nextAction?.stepId) {
                handleSelectStep(readiness.nextAction.stepId);
                setSheet('inspector');
                return;
              }
              setShowPublish(true);
            }}
          />
        }
      />

      {readiness.nextAction ? (
        <LiveEditorNextCard
          title={readiness.nextAction.title}
          description={readiness.nextAction.description}
          ready={readiness.readinessScore >= 100}
          onAction={() => {
            if (readiness.readinessScore >= 100) {
              setShowPublish(true);
              return;
            }
            if (readiness.nextAction?.stepId) {
              handleSelectStep(readiness.nextAction.stepId);
              setSheet('inspector');
            }
          }}
        />
      ) : null}

      <div className="live-editor-workspace">
        <LiveEditorStepRail
          steps={readiness.steps}
          activeStepId={activeStepId}
          onSelectStep={handleSelectStep}
          completedSteps={readiness.completedSteps}
          totalSteps={readiness.totalSteps}
          nextHint={readiness.nextAction?.title ?? null}
        />

        <div className="live-editor-main">
          <div className="live-editor-stage-wrap">
            <div className="live-editor-stage-toolbar live-editor-stage-toolbar--desktop">
                <LiveEditorPreviewModeSwitch
                  mode={previewMode}
                  onChange={(mode) => {
                    setPreviewMode(mode);
                    setMobileTab(mode === 'guest' ? 'preview' : 'edit');
                  }}
                />
                <div className="live-editor-stage-toolbar__actions">
                  <button
                    type="button"
                    className={cn('live-editor-pill', sheet === 'sections' && 'live-editor-pill--active')}
                    onClick={() => setSheet(sheet === 'sections' ? null : 'sections')}
                    data-testid="live-editor-sections"
                  >
                    <Layers className="h-4 w-4" aria-hidden />
                    <span>{t('liveEditor.sections')}</span>
                  </button>
                </div>
              </div>

            <div
              className="live-editor-stage live-editor-scroll-surface"
              data-testid="live-editor-stage"
              data-preview-mode={previewMode}
              onClick={handleStageClick}
            >
              <div
                className={
                  previewMode === 'desktop'
                    ? 'live-editor-preview-frame live-editor-preview-frame--desktop'
                    : 'live-editor-preview-frame'
                }
              >
                <LiveEditorPhonePreview testId="live-editor-preview">
                  <InvitationLayoutRouter
                    slug="draft"
                    guestToken={null}
                    isEditing={isEditingPreview}
                    initialInvitation={invitationPreview}
                    documentSections={sortedSections}
                    onFieldChange={handleFieldSave}
                    isPublished={isPublished || document.meta.status === 'published'}
                    backHref="/templates"
                    guestNames={[]}
                    guests={[]}
                    isLoggedIn={isLoggedIn}
                    suppressGuestChrome
                    previewChrome="wide"
                    previewEmbedFrame
                  />
                </LiveEditorPhonePreview>
              </div>
            </div>

            {!isGuestPreview && activeSection ? (
              <LiveEditorContextBar
                canHide={Boolean(activeSection.canHide && activeSection.visible)}
                onPhoto={pickCover}
                onHide={() => {
                  if (!activeSection.canHide) return;
                  actions.setSectionVisible(activeSection.id, false);
                }}
              />
            ) : null}

            <button
              type="button"
              className="live-editor-fields-handle live-editor-fields-handle--mobile"
              onClick={() => setSheet(sheet === 'inspector' ? null : 'inspector')}
              data-testid="live-editor-all-fields"
            >
              <ChevronUp aria-hidden />
              {activeSection ? 'Настройки блока' : 'Все поля'}
            </button>
          </div>

          <aside className="live-editor-side-panel live-editor-side-panel--desktop" data-testid="live-editor-side-panel">
              <div className="live-editor-side-panel__head">
                <h3>{activeSection ? 'Настройки блока' : 'Ваше приглашение'}</h3>
                <p>
                  {readiness.nextAction?.description ??
                    'Нажмите на любой блок в приглашении — здесь появятся поля для правки.'}
                </p>
              </div>
              {inspectorBody}
              <button
                type="button"
                className="live-editor-side-panel__publish"
                onClick={() => setShowPublish(true)}
                disabled={isPublishing}
              >
                {readiness.readinessScore >= 100 ? 'Готово к публикации' : 'Проверить перед публикацией'}
              </button>
            </aside>
        </div>
      </div>

      <LiveEditorBottomNav
        active={mobileTab}
        onChange={handleMobileNav}
        readinessScore={readiness.readinessScore}
        onPrimaryAction={handlePrimaryNavAction}
        onSections={() => setSheet(sheet === 'sections' ? null : 'sections')}
        primaryLabelReady="Перейти к публикации"
        primaryLabelNext="Продолжить спокойно"
      />

      <LiveEditorSheet
        open={sheet === 'inspector' || sheet === 'fields'}
        title={activeSection ? 'Настройки блока' : 'Поля'}
        onClose={() => setSheet(null)}
        testId="live-editor-inspector-sheet"
        mobileOnly
      >
        {inspectorBody}
        <div className="live-editor-inspector__divider" />
        <LiveEditorFieldsSheetBody
          groomName={String(document.customText.groomName ?? '')}
          brideName={String(document.customText.brideName ?? '')}
          eventDate={readFieldValue(document, 'eventDate')}
          eventTime={String(document.meta.eventTime ?? '')}
          eventPlace={String(document.meta.eventPlace ?? '')}
          onFieldChange={(field, value) => void handleFieldSave(field, value)}
          onCoverPhoto={pickCover}
        />
      </LiveEditorSheet>

      <LiveEditorSheet
        open={sheet === 'sections'}
        title="Секции"
        onClose={() => setSheet(null)}
        testId="live-editor-sections-sheet"
      >
        <LiveEditorSectionsSheetBody
          sections={sortedSections}
          activeSectionId={resolvedActiveId}
          onSelect={(id) => {
            setActiveSectionId(id);
            setSheet('inspector');
          }}
          onMove={(id, direction) => actions.moveSection(id, direction)}
          onToggleVisible={(id, visible) => actions.setSectionVisible(id, visible)}
        />
      </LiveEditorSheet>

      <LiveEditorPublishConfidence
        open={showPublish}
        onClose={() => setShowPublish(false)}
        readiness={readiness}
        previewHref={previewHref}
        title={document.meta.title || templateName}
        isPublishing={isPublishing}
        isPublished={isPublished || document.meta.status === 'published'}
        onPublish={() => void handlePublishConfirm()}
        onShare={() => void handleShare()}
      />

      <LiveEditorGuidedStart
        open={guidedOpen}
        templateName={templateName}
        initial={{
          groomName: String(document.customText.groomName ?? ''),
          brideName: String(document.customText.brideName ?? ''),
          eventDate: readFieldValue(document, 'eventDate'),
          eventTime: String(document.meta.eventTime ?? ''),
          eventPlace: String(document.meta.eventPlace ?? ''),
          coverPhoto: readFieldValue(document, 'templateData.coverPhoto'),
        }}
        onSkip={() => {
          markGuidedDone();
          setGuidedOpen(false);
        }}
        onComplete={applyGuidedValues}
        onCoverPick={(setUrl) => pickImageFile(setUrl)}
      />

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => {
          setIsLoggedIn(true);
          setShowLogin(false);
          void handleSave();
        }}
      />
    </LiveEditorShell>
  );
}
