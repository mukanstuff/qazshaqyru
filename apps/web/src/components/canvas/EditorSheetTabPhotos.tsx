'use client';

import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { UploadButton } from '@/components/invitation-layouts/UploadButton';
import { RemoteMediaImage } from '@/components/shared/RemoteMediaImage';
import type { ImageElement, InvitationCanvasDocument } from '@/lib/canvas/types';
import { updateElement } from '@/lib/canvas/mutations';

interface Props {
  document: InvitationCanvasDocument;
  invitationId?: string;
  onDocumentChange: (next: InvitationCanvasDocument) => void;
}

/**
 * "Photos" tab.
 *
 * Lists every `image` element in the document. Upload goes to the existing
 * image upload endpoint (same as the legacy GalleryPanel — that endpoint
 * is fine, we're just driving it from inside the canvas-document model).
 * Remove clears `src` back to the placeholder.
 */
export function EditorSheetTabPhotos({
  document,
  invitationId,
  onDocumentChange,
}: Props) {
  const { t } = useI18n();

  const imageEls = document.elements.filter(
    (e): e is ImageElement => e.type === 'image'
  );

  const patchEl = useCallback(
    (id: string, patch: Partial<ImageElement>) => {
      onDocumentChange(updateElement(document, id, patch));
    },
    [document, onDocumentChange]
  );

  if (imageEls.length === 0) {
    return (
      <p className="editor-sheet-empty">
        {t('invitation.edit.canvas.sheet.photosEmpty')}
      </p>
    );
  }

  return (
    <div className="editor-sheet-section-stack">
      {imageEls.map((el, i) => (
        <div key={el.id} className="editor-sheet-section editor-photo-row">
          <h3 className="editor-sheet-section-title">Фото {i + 1}</h3>
          {el.src && el.src !== '/assets/placeholder.svg' ? (
            <div className="editor-photo-thumb">
              <RemoteMediaImage src={el.src} alt="" fill className="object-cover" />
            </div>
          ) : null}
          <div className="editor-photo-actions">
            <UploadButton
              invitationId={invitationId}
              label={t('invitation.edit.canvas.sheet.uploadImage')}
              onUpload={(url) => patchEl(el.id, { src: url })}
            />
            {el.src && el.src !== '/assets/placeholder.svg' && (
              <button
                type="button"
                className="editor-icon-btn"
                onClick={() => patchEl(el.id, { src: '/assets/placeholder.svg' })}
                aria-label={t('common.remove')}
                title={t('common.remove')}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
