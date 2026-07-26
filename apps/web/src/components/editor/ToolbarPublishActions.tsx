'use client';

import { useState, useCallback, useMemo } from 'react';
import { Check, Loader2, Share2 } from 'lucide-react';
import { SendInvitesModal } from '@/components/publish/SendInvitesModal';
import { QrCodePanel } from '@/components/shared/QrCodePanel';
import { WhatsappIcon } from '@/components/shared/ornaments';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';
import { buildPublicInviteUrl, buildInviteShareMessage, buildWhatsAppShareUrl } from '@/lib/invitations/share-url';

interface ToolbarPublishActionsProps {
  isPublished: boolean;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  invitationId?: string;
  invitationSlug: string;
  invitationTitle: string;
  guestCount: number;
  openRsvp: boolean;
  publishPriceKzt: number;
  onUnpublish?: () => void;
  onArchive?: () => void;
  onPublishClick: () => void;
  onCopyLink: () => Promise<void>;
  /** Toolbar sits on toolbar bar — use light button styles */
  onDarkBar?: boolean;
}

export function ToolbarPublishActions({
  isPublished,
  isSaving,
  saveStatus,
  invitationId,
  invitationSlug,
  invitationTitle,
  guestCount,
  openRsvp,
  publishPriceKzt,
  onUnpublish,
  onArchive,
  onPublishClick,
  onCopyLink,
  onDarkBar = true,
}: ToolbarPublishActionsProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCopy = useCallback(async () => {
    await onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopyLink]);

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/i/${invitationSlug}`;
    return buildPublicInviteUrl(window.location.origin, invitationSlug);
  }, [invitationSlug]);

  const whatsappShareUrl = useMemo(() => {
    const text = buildInviteShareMessage(publicUrl, invitationTitle);
    return buildWhatsAppShareUrl(text);
  }, [publicUrl, invitationTitle]);

  const ghostOnDark = onDarkBar
    ? 'text-white/90 hover:bg-white/10 hover:text-white'
    : undefined;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {saveStatus === 'saving' && (
        <span className="inline-flex items-center gap-1 font-body text-xs text-white/70">
          <Loader2 size={12} className="animate-spin" />
          <span>{t('invitation.edit.saving')}</span>
        </span>
      )}
      {saveStatus === 'saved' && (
        <span className="inline-flex items-center gap-1 font-body text-xs text-us-cta-hover">
          <Check size={12} />
          <span>{t('invitation.edit.saved')}</span>
        </span>
      )}
      {isSaving && saveStatus === 'idle' && (
        <span className="inline-flex items-center gap-1 font-body text-xs text-white/70">
          <Loader2 size={12} className="animate-spin" />
          {t('invitation.edit.saving')}
        </span>
      )}

      {isPublished ? (
        <>
          {onUnpublish ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={ghostOnDark}
              onClick={() => void onUnpublish()}
              disabled={isSaving}
            >
              {t('invitation.edit.unpublish')}
            </Button>
          ) : null}
          {onArchive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={ghostOnDark}
              onClick={() => void onArchive()}
              disabled={isSaving}
            >
              {t('common.archiveInvite')}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={ghostOnDark}
            onClick={() => void handleCopy()}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span className="hidden sm:inline">
              {copied ? t('invitation.edit.copied') : t('invitation.edit.copyLink')}
            </span>
          </Button>
          <Button variant="ghost" size="sm" className={ghostOnDark} asChild>
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={t('invitation.sendModal.shareWhatsApp')}
            >
              <WhatsappIcon size={16} />
              <span className="hidden sm:inline">{t('invitation.sendModal.shareWhatsApp')}</span>
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={ghostOnDark}
            onClick={() => setShowQr((v) => !v)}
          >
            QR
          </Button>
          {showQr ? (
            <div className="absolute right-4 top-full z-50 mt-2 rounded-lg border border-us-border bg-us-surface p-3 shadow-us-lg">
              <QrCodePanel
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/i/${invitationSlug}`}
                label={t('invitation.edit.qrLabel')}
              />
            </div>
          ) : null}
          {invitationId ? (
            <SendInvitesModal
              invitationId={invitationId}
              invitationSlug={invitationSlug}
              invitationTitle={invitationTitle}
              guestCount={guestCount}
              openRsvpEnabled={openRsvp}
            />
          ) : null}
        </>
      ) : (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onPublishClick}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
          {publishPriceKzt > 0
            ? t('invitation.edit.publishFreemium')
            : t('invitation.edit.publish')}
        </Button>
      )}
    </div>
  );
}
