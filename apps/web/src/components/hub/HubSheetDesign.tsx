'use client';

import { PencilLine } from 'lucide-react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  editHref: string;
}

/**
 * 2026-08-18 (Phase 2, hub screen): confirm-and-link sheet for the existing
 * advanced canvas editor. Just a CTA — the editor itself is unchanged.
 */
export function HubSheetDesign({ open, onClose, editHref }: Props) {
  const { t } = useI18n();
  return (
    <HubSheet
      open={open}
      onClose={onClose}
      title={t('invitation.hub.designSheet.title')}
      subtitle={t('invitation.hub.designSheet.subtitle')}
      footer={
        <div className="hub-share-buttons" style={{ marginTop: 0 }}>
          <button type="button" className="hub-btn" onClick={onClose}>
            {t('invitation.hub.designSheet.cancel')}
          </button>
          <a className="hub-btn hub-btn--primary" href={editHref}>
            <PencilLine size={16} aria-hidden="true" />
            {t('invitation.hub.designSheet.open')}
          </a>
        </div>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--hub-text-muted)' }}>
        Цвета, шрифты, декор, порядок блоков и точные позиции — там.
      </p>
    </HubSheet>
  );
}