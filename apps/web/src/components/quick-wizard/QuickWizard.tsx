'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { InvitationLayoutRouter } from '@/components/invitation-layouts/LayoutRouter';
import type { InvitationData } from '@/components/invitation-layouts/types';
import { UploadButton } from '@/components/invitation-layouts/UploadButton';
import { LoginModal } from '@/components/auth/LoginModal';
import { PublishStepper } from '@/components/publish/PublishStepper';
import { PreviewWatermark } from '@/components/publish/PreviewWatermark';
import { EditorWorkspaceShell } from '@/components/editor/EditorWorkspaceShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/shared/utils';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';
import {
  type QuickWizardFormData,
  type QuickWizardEventType,
  validateQuickWizardStep,
  buildInvitationTitle,
} from '@/lib/shared/quick-wizard-schema';
import {
  saveDraft,
  eventTypeFromTemplateKey,
  type LocalDraft,
} from '@/lib/invitations/draft-storage';
import { syncDraftToServer } from '@/lib/invitations/draft-sync-client';
import { checkoutInvitationClient } from '@/lib/payments/checkout-client';
import { DEFAULT_PUBLICATION_PRICE_KZT } from '@/lib/invitations/invitation-pricing';
import { resolvePublishStep } from '@/lib/invitations/publish-flow';

const TOTAL_STEPS = 5;

interface Props {
  templateKey: string;
  templateId: string;
  templateName: string;
}

const EMPTY_FORM: QuickWizardFormData = {
  eventType: 'wedding',
  names: '',
  eventDate: '',
  eventTime: '',
  eventPlace: '',
  address: '',
  coverPhoto: '',
};

function formToDraft(
  form: QuickWizardFormData,
  templateKey: string,
  templateId: string,
  templateName: string,
  language: 'ru' | 'kz'
): LocalDraft {
  const title = buildInvitationTitle(form.names) || templateName;
  return {
    templateKey,
    templateId,
    title,
    eventType: form.eventType,
    eventDate: new Date(form.eventDate).toISOString(),
    eventTime: form.eventTime || null,
    eventPlace: form.eventPlace,
    address: form.address || null,
    mapUrl: null,
    musicUrl: null,
    templateData: form.coverPhoto ? { coverPhoto: form.coverPhoto } : {},
    customText: {
      greeting: form.names,
      invitationLocale: language,
    },
    guests: [],
    eventTimezone: 'Asia/Almaty',
    language,
    fromWizard: true,
    updatedAt: new Date().toISOString(),
  };
}

function draftToInvitationData(draft: LocalDraft): InvitationData {
  return {
    id: 'draft',
    slug: 'draft',
    title: draft.title,
    eventType: draft.eventType,
    eventDate: draft.eventDate,
    eventTime: draft.eventTime ?? null,
    eventPlace: draft.eventPlace ?? null,
    eventTimezone: draft.eventTimezone,
    templateKey: draft.templateKey,
    templateData: draft.templateData as InvitationData['templateData'],
    musicUrl: draft.musicUrl ?? null,
    mapUrl: draft.mapUrl ?? null,
    address: draft.address ?? null,
    customText: draft.customText,
    language: draft.language,
    hostName: null,
    isPast: false,
  };
}

export function QuickWizard({ templateKey, templateId, templateName }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useI18n();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<QuickWizardFormData>({
    ...EMPTY_FORM,
    eventType: eventTypeFromTemplateKey(templateKey) as QuickWizardEventType,
    eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewDraft, setPreviewDraft] = useState<LocalDraft | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [serverInvitationId, setServerInvitationId] = useState<string | undefined>();

  const eventTypes: QuickWizardEventType[] = [
    'wedding',
    'toy',
    'betashar',
    'kyz_uzatu',
    'sundet_toy',
    'birthday',
    'anniversary',
    'corporate',
    'other',
  ];

  const updateForm = useCallback((patch: Partial<QuickWizardFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors({});
  }, []);

  const goNext = () => {
    const validation = validateQuickWizardStep(step, form);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    const draft = formToDraft(form, templateKey, templateId, templateName, locale);
    saveDraft(draft);
    setPreviewDraft(draft);
    setStep(TOTAL_STEPS + 1);
  };

  const goBack = () => {
    if (step === TOTAL_STEPS + 1) {
      setStep(TOTAL_STEPS);
      setPreviewDraft(null);
      return;
    }
    if (step > 1) setStep((s) => s - 1);
    else router.push('/templates');
  };

  const ensureSaved = async (draft: LocalDraft): Promise<string> => {
    if (serverInvitationId) return serverInvitationId;
    const result = await syncDraftToServer(draft);
    const next = { ...draft, serverInvitationId: result.serverInvitationId };
    saveDraft(next);
    setServerInvitationId(result.serverInvitationId);
    setPreviewDraft(next);
    return result.serverInvitationId;
  };

  const handlePublish = async () => {
    if (!previewDraft) return;

    const sessionRes = await fetch('/api/auth/session');
    const sessionData = await sessionRes.json();
    if (!sessionData.user) {
      setShowLogin(true);
      return;
    }
    setIsLoggedIn(true);

    setIsPublishing(true);
    try {
      const invitationId = await ensureSaved(previewDraft);
      const checkout = await checkoutInvitationClient(invitationId);
      if (checkout.needsPayment && checkout.paymentUrl) {
        window.location.href = checkout.paymentUrl;
        return;
      }
      if (checkout.published && checkout.publicUrl) {
        toast({ title: t('quickWizard.published'), description: t('quickWizard.publishedHint') });
        router.push(`/invitations/${invitationId}?published=1`);
        return;
      }
      router.push(`/invitations/${invitationId}?payment=pending`);
    } catch (err) {
      toast({
        title: t('invitation.editorToasts.publishFailed'),
        description: err instanceof Error ? err.message : t('checkout.genericError'),
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLoginSuccess = async () => {
    setShowLogin(false);
    setIsLoggedIn(true);
    if (previewDraft) await handlePublish();
  };

  const publishStep = resolvePublishStep({
    isPublished: false,
    isLoggedIn,
    needsPayment: true,
    paymentPending: isPublishing,
  });

  if (step === TOTAL_STEPS + 1 && previewDraft) {
    return (
      <EditorWorkspaceShell
        className="flex min-h-screen flex-col"
        data-testid="quick-wizard-preview"
      >
        <header className="sticky top-0 z-50 bg-us-accent px-4 py-3 text-white shadow-us-sm sm:px-6">
          <PublishStepper current={publishStep} needsPayment variant="wizard" className="on-dark" />
        </header>

        <div className="flex flex-1 flex-col items-center px-4 py-8 pb-36 sm:px-6">
          <p className="mb-6 max-w-md text-center font-body text-sm text-us-ink-muted">
            {t('quickWizard.checkoutMessage').replace(
              '{price}',
              DEFAULT_PUBLICATION_PRICE_KZT.toLocaleString('ru-RU')
            )}
          </p>

          <div className="relative w-full max-w-sm">
            <PreviewWatermark label={t('quickWizard.previewWatermark')} />
            <div className="overflow-hidden rounded-xl border border-us-border">
              <InvitationLayoutRouter
                slug="draft"
                guestToken={null}
                isEditing={false}
                initialInvitation={draftToInvitationData(previewDraft)}
                isPublished={false}
                backHref="/templates"
                guestNames={[]}
                guests={[]}
                publishPriceKzt={DEFAULT_PUBLICATION_PRICE_KZT}
                isLoggedIn={isLoggedIn}
                suppressGuestChrome
              />
            </div>
          </div>
        </div>

        <footer className="us-glass-strong sticky bottom-0 z-50 shrink-0 border-t px-4 py-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-md flex-col gap-3">
            <Button
              type="button"
              variant="default"
              className="relative z-10 w-full"
              onClick={() => void handlePublish()}
              disabled={isPublishing}
            >
              {isPublishing
                ? t('common.saving')
                : t('quickWizard.payToPublish').replace(
                    '{price}',
                    DEFAULT_PUBLICATION_PRICE_KZT.toLocaleString('ru-RU')
                  )}
            </Button>
          </div>
        </footer>

        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSuccess={() => void handleLoginSuccess()}
          title={t('auth.publishLoginTitle')}
          subtitle={t('quickWizard.loginSubtitle')}
        />
      </EditorWorkspaceShell>
    );
  }

  return (
    <EditorWorkspaceShell className="flex min-h-screen flex-col" data-testid="quick-wizard">
      <header className="sticky top-0 z-50 bg-us-accent text-white shadow-us-sm">
        <div className="flex h-16 flex-col justify-center gap-2 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white/90 hover:bg-white/10 hover:text-white"
              onClick={goBack}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
            <span className="font-body text-xs text-white/70">
              {t('quickWizard.stepOf')
                .replace('{current}', String(step))
                .replace('{total}', String(TOTAL_STEPS))}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i < step ? 'bg-us-cta' : 'bg-white/30'
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="us-container-editor mx-auto w-full max-w-lg flex-1 py-8">
        <h1 className="font-display text-2xl text-us-ink">
          {t(`quickWizard.step${step}Title` as 'quickWizard.step1Title')}
        </h1>
        <p className="mt-2 mb-6 font-body text-sm text-us-ink-muted">
          {t(`quickWizard.step${step}Subtitle` as 'quickWizard.step1Subtitle')}
        </p>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {eventTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateForm({ eventType: type })}
                className={cn(
                  'rounded-lg border bg-us-surface p-3 text-left shadow-us-sm transition-all hover:border-us-accent/30',
                  form.eventType === type
                    ? 'ring-2 ring-us-accent ring-offset-2 ring-offset-us-ivory'
                    : 'border-us-border'
                )}
              >
                <span className="font-body text-sm font-medium text-us-ink">
                  {t(`events.${type}` as 'events.wedding')}
                </span>
              </button>
            ))}
            {errors.eventType && (
              <p className="col-span-full font-body text-sm text-us-danger" role="alert">
                {errors.eventType}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <Label htmlFor="qw-names">{t('quickWizard.namesLabel')}</Label>
            <Input
              id="qw-names"
              type="text"
              value={form.names}
              onChange={(e) => updateForm({ names: e.target.value })}
              placeholder={t('quickWizard.namesPlaceholder')}
              autoFocus
            />
            {errors.names && (
              <p className="font-body text-sm text-us-danger" role="alert">
                {errors.names}
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qw-date">{t('quickWizard.dateLabel')}</Label>
              <Input
                id="qw-date"
                type="date"
                value={form.eventDate.slice(0, 10)}
                onChange={(e) => updateForm({ eventDate: e.target.value })}
              />
              {errors.eventDate && (
                <p className="font-body text-sm text-us-danger" role="alert">
                  {errors.eventDate}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="qw-time">{t('quickWizard.timeLabel')}</Label>
              <Input
                id="qw-time"
                type="time"
                value={form.eventTime || ''}
                onChange={(e) => updateForm({ eventTime: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qw-venue">{t('quickWizard.venueLabel')}</Label>
              <Input
                id="qw-venue"
                type="text"
                value={form.eventPlace}
                onChange={(e) => updateForm({ eventPlace: e.target.value })}
                placeholder={t('quickWizard.venuePlaceholder')}
                autoFocus
              />
              {errors.eventPlace && (
                <p className="font-body text-sm text-us-danger" role="alert">
                  {errors.eventPlace}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="qw-address">{t('quickWizard.addressLabel')}</Label>
              <Input
                id="qw-address"
                type="text"
                value={form.address || ''}
                onChange={(e) => updateForm({ address: e.target.value })}
                placeholder={t('quickWizard.addressPlaceholder')}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="font-body text-sm text-us-ink-muted">{t('quickWizard.photoHint')}</p>
            {form.coverPhoto ? (
              <Card className="overflow-hidden shadow-us-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverPhoto} alt="" className="aspect-video w-full object-cover" />
                <div className="p-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateForm({ coverPhoto: '' })}
                  >
                    {t('common.remove')}
                  </Button>
                </div>
              </Card>
            ) : null}
            <UploadButton
              onUpload={(url) => updateForm({ coverPhoto: url })}
              label={t('quickWizard.uploadPhoto')}
            />
          </div>
        )}
      </main>

      <footer className="us-glass-strong sticky bottom-0 border-t px-4 py-4 sm:px-6">
        <div className="mx-auto w-full max-w-lg space-y-2">
          <Button type="button" variant="default" className="w-full" onClick={goNext} data-testid="quick-wizard-next">
            {step === TOTAL_STEPS ? (
              <>
                <Check className="h-4 w-4" />
                {t('quickWizard.createPreview')}
              </>
            ) : (
              <>
                {t('common.next')}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-center font-body text-xs text-us-ink-muted">{t('quickWizard.editingFree')}</p>
        </div>
      </footer>
    </EditorWorkspaceShell>
  );
}
