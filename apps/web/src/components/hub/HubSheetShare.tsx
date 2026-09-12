'use client';

import { useState } from 'react';
import { Copy, Eye, MessageCircle } from 'lucide-react';
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
  /** Published invitations get the link; drafts get the preview. */
  published: boolean;
  open: boolean;
  onClose: () => void;
}

/**
 * 2026-08-18 (Phase 2, hub screen): share sheet — copy / open / WhatsApp / QR.
 * Reuses the existing share-url helpers and QrCodePanel.
 *
 * 2026-09-11: opens before publication too.
 *
 * «Как гости увидят» was a locked row on every draft, which is the wrong thing
 * to lock: it is the one row that answers "what am I paying for". The link
 * genuinely cannot be handed out yet — /i/<slug> 404s for everyone but the
 * owner until publish, and a generated `draft-…` slug is replaced at publish,
 * so even showing the address would be a lie. The preview is not a lie: the
 * owner can open their own draft, and that is exactly what a guest will see.
 */
export function HubSheetShare({
  invitationId,
  invitationSlug,
  invitationTitle,
  published,
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

  if (!published) {
    return (
      <HubSheet
        open={open}
        onClose={onClose}
        /* The row's own name, not «Поделиться» — there is nothing to share
           yet, and a sheet titled differently from the row that opened it
           reads as the wrong sheet. */
        title={t('invitation.hub.sectionShareTitle')}
        subtitle={t('invitation.hub.shareSheet.previewSubtitle')}
      >
        <p className="hub-note" style={{ marginTop: 0 }}>
          {t('invitation.hub.shareSheet.previewDesc')}
        </p>

        <div className="hub-share-buttons">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hub-btn hub-btn--primary"
            style={{ width: '100%' }}
          >
            <Eye size={16} aria-hidden="true" />
            {t('invitation.hub.shareSheet.previewCta')}
          </a>
        </div>

        <p className="hub-note">{t('invitation.hub.shareSheet.previewNote')}</p>

        {/* Hidden input preserves SSR parity for invitationId */}
        <input type="hidden" value={invitationId} readOnly />
      </HubSheet>
    );
  }

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