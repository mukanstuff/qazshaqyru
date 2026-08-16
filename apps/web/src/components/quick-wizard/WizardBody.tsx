'use client';

import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginModal } from '@/components/auth/LoginModal';
import { UploadButton } from '@/components/invitation-layouts/UploadButton';
import { useI18n } from '@/i18n';
import { useWizardForm, getWizardReturnTo } from './useWizardForm';

export interface WizardBodyProps {
  templateKey: string;
  templateId: string;
  templateName: string;
  /** Path to redirect after successful persistence (default: /canvas). */
  onAfterPersist?: (invitationId: string, slug: string) => void;
  /** When true, footer shows "Continue" button instead of "Save & login". */
  continueLabel?: string;
  /** Header: shown if provided. WizardBody does not own a header. */
  header?: React.ReactNode;
  /** Footer: shown if provided. Otherwise default sticky footer. */
  footer?: React.ReactNode;
}

/**
 * Single-step wizard body — all fields on one screen.
 * Renders only the form + modal + submit button. No top-level layout.
 * Use this directly inside a sheet/dialog/page so the host can compose UX.
 */
export function WizardBody({
  templateKey,
  templateId,
  templateName,
  onAfterPersist,
  continueLabel,
  header,
  footer,
}: WizardBodyProps) {
  const { t } = useI18n();
  const returnTo = getWizardReturnTo(templateKey);

  const {
    form,
    errors,
    updateForm,
    isSubmitting,
    showLogin,
    closeLogin,
    submit,
  } = useWizardForm({
    templateKey,
    templateId,
    templateName,
    returnTo,
    onAfterPersist,
  });

  return (
    <div className="flex flex-col" data-testid="quick-wizard">
      {header}

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-us-ink">
          {t('quickWizard.step1Title')}
        </h1>
        <p className="mt-2 mb-6 font-body text-sm text-us-ink-muted">
          {t('quickWizard.step1Subtitle')}
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="qw-names">{t('quickWizard.namesLabel')}</Label>
            <Input
              id="qw-names"
              type="text"
              value={form.names}
              onChange={(e) => updateForm({ names: e.target.value })}
              placeholder={t('quickWizard.namesPlaceholder')}
            />
            {errors.names && (
              <p className="font-body text-sm text-us-danger" role="alert">
                {errors.names}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <div className="space-y-2">
            <Label htmlFor="qw-venue">{t('quickWizard.venueLabel')}</Label>
            <Input
              id="qw-venue"
              type="text"
              value={form.eventPlace}
              onChange={(e) => updateForm({ eventPlace: e.target.value })}
              placeholder={t('quickWizard.venuePlaceholder')}
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

          <div className="space-y-2">
            <Label>{t('quickWizard.coverPhotoLabel')}</Label>
            <p className="font-body text-xs text-us-ink-muted">{t('quickWizard.photoHint')}</p>
            {form.coverPhoto ? (
              <Card className="overflow-hidden shadow-us-sm">
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
            ) : (
              <UploadButton
                onUpload={(url) => updateForm({ coverPhoto: url })}
                label={t('quickWizard.uploadPhoto')}
              />
            )}
          </div>
        </div>
      </main>

      {footer ?? (
        <footer className="us-glass-strong sticky bottom-0 border-t px-4 py-4 sm:px-6">
          <div className="mx-auto w-full max-w-lg space-y-2">
            <Button
              type="button"
              variant="default"
              className="w-full"
              onClick={() => void submit()}
              disabled={isSubmitting}
              data-testid="quick-wizard-submit"
            >
              {isSubmitting ? (
                t('common.saving')
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {continueLabel ?? t('quickWizard.submitAndLogin')}
                </>
              )}
            </Button>
            <p className="text-center font-body text-xs text-us-ink-muted">
              {t('quickWizard.editingFree')}
            </p>
          </div>
        </footer>
      )}

      <LoginModal
        open={showLogin}
        onClose={closeLogin}
        returnTo={returnTo}
      />
    </div>
  );
}
