'use client';

import { useI18n } from '@/i18n';
import { UploadButton } from '@/components/invitation-layouts/UploadButton';
import { RemoteMediaImage } from '@/components/shared/RemoteMediaImage';
import { Button } from '@/components/ui/button';
import { EditorPanelShell } from './EditorPanelShell';

interface Props {
  invitationId?: string;
  templateData: {
    galleryPhoto1?: string;
    galleryPhoto2?: string;
    galleryPhoto3?: string;
  };
  onUpdate: (key: string, url: string) => void;
  onClose: () => void;
}

const KEYS = ['galleryPhoto1', 'galleryPhoto2', 'galleryPhoto3'] as const;

export function GalleryPanel({ invitationId, templateData, onUpdate, onClose }: Props) {
  const { t } = useI18n();

  return (
    <EditorPanelShell title={t('invitation.edit.toolbarGallery')} onClose={onClose}>
      <p className="font-body text-sm text-us-ink-muted">{t('invitation.edit.galleryHint')}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {KEYS.map((key, i) => (
          <div key={key} className="space-y-2">
            {templateData[key] ? (
              <div className="relative aspect-square overflow-hidden rounded-md border border-us-border">
                <RemoteMediaImage src={templateData[key]!} alt="" fill className="object-cover" />
              </div>
            ) : null}
            <UploadButton
              invitationId={invitationId}
              label={String(i + 1)}
              onUpload={(url) => onUpdate(key, url)}
            />
            {templateData[key] && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onUpdate(key, '')}>
                {t('common.remove')}
              </Button>
            )}
          </div>
        ))}
      </div>
    </EditorPanelShell>
  );
}
