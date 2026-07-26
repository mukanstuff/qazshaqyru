'use client';

import { RemoteMediaImage } from '@/components/shared/RemoteMediaImage';
import { UploadButton } from '@/components/invitation-layouts/UploadButton';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { EditorPanelShell } from './EditorPanelShell';

interface BackgroundPanelProps {
  invitationId?: string;
  bgUrl: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function BackgroundPanel({
  invitationId,
  bgUrl,
  onUpload,
  onRemove,
  onClose,
}: BackgroundPanelProps) {
  const { t } = useI18n();

  return (
    <EditorPanelShell title={t('invitation.edit.uploadPhoto')} onClose={onClose}>
      <UploadButton
        invitationId={invitationId}
        onUpload={(url) => {
          onUpload(url);
          onClose();
        }}
      />

      {bgUrl ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-md border border-us-border">
              <RemoteMediaImage src={bgUrl} alt="Preview" fill className="object-cover" />
            </div>
            <span className="font-body text-xs text-us-success">{t('invitation.edit.bgUploaded')}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onRemove();
              onClose();
            }}
          >
            {t('invitation.edit.removeBg')}
          </Button>
        </div>
      ) : null}
    </EditorPanelShell>
  );
}
