'use client';

import { useState } from 'react';
import { Copy, MessageCircle, QrCode as QrIcon } from 'lucide-react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { QrCodePanel } from '@/components/shared/QrCodePanel';
import {
  buildInviteShareMessage,
  buildPublicInviteUrl,
  buildWhatsAppShareUrl,
} from '@/lib/invitations/share-url';

interface Props {
  invitationId: string;
  invitationSlug: string;
  invitationTitle: string;
  open: boolean;
  onClose: () => void;
}

/**
 * 2026-08-18 (Phase 2, hub screen): share sheet — copy / open / WhatsApp / QR.
 * Reuses the existing share-url helpers and QrCodePanel.
 */
export function HubSheetShare({
  invitationId,
  invitationSlug,
  invitationTitle,
  open,
  onClose,
}: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== 'undefined'
      ? buildPublicInviteUrl(window.location.origin, invitationSlug)
      : `/i/${invitationSlug}`;
  const shareText = buildInviteShareMessage(publicUrl, invitationTitle);
  const whatsappUrl = buildWhatsAppShareUrl(shareText);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = publicUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <HubSheet
      open={open}
      onClose={onClose}
      title={t('invitation.hub.shareSheet.title')}
      subtitle={t('invitation.hub.shareSheet.subtitle')}
    >
      <div className="hub-url-box">
        <span className="hub-url-text">{publicUrl}</span>
        <button type="button" className="hub-url-copy" onClick={onCopy}>
          {copied ? t('invitation.hub.shareSheet.copied') : t('invitation.hub.shareSheet.copy')}
        </button>
      </div>

      <div className="hub-share-buttons">
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hub-btn hub-btn--primary"
        >
          <Copy size={16} aria-hidden="true" />
          {t('invitation.hub.shareSheet.open')}
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hub-btn"
        >
          <MessageCircle size={16} aria-hidden="true" />
          {t('invitation.hub.shareSheet.whatsapp')}
        </a>
      </div>

      <div className="hub-qr">
        <QrCodePanel url={publicUrl} size={180} label={t('invitation.hub.shareSheet.qrLabel')} />
      </div>
      <p className="hub-note">{t('invitation.hub.shareSheet.qrHint')}</p>

      {/* Hidden input preserves SSR parity for invitationId */}
      <input type="hidden" value={invitationId} readOnly />
    </HubSheet>
  );
}