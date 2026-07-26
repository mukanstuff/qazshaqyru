'use client';

import { useState, useMemo, useCallback } from 'react';
import { Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { QrCodePanel } from '@/components/shared/QrCodePanel';
import { WhatsappIcon } from '@/components/shared/ornaments';
import { buildPublicInviteUrl, buildInviteShareMessage, buildWhatsAppShareUrl } from '@/lib/invitations/share-url';

interface Props {
  invitationSlug: string;
  invitationTitle: string;
  openRsvp: boolean;
}

export function PostPublishShare({ invitationSlug, invitationTitle, openRsvp }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/i/${invitationSlug}`;
    return buildPublicInviteUrl(window.location.origin, invitationSlug);
  }, [invitationSlug]);

  const shareText = useMemo(
    () => buildInviteShareMessage(publicUrl, invitationTitle),
    [publicUrl, invitationTitle],
  );

  const whatsappUrl = useMemo(() => buildWhatsAppShareUrl(shareText), [shareText]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable */
    }
  }, [publicUrl]);

  return (
    <div className="space-y-3 border-b border-us-border bg-us-cta/5 px-4 py-4 sm:px-6">
      <strong className="font-display text-base text-us-ink">{t('invitation.edit.postPublishTitle')}</strong>
      <p className="font-body text-sm text-us-ink-muted">
        {openRsvp
          ? t('invitation.edit.postPublishOpenRsvp')
          : t('invitation.edit.postPublishPersonalRsvp')}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
          {copied ? <Check size={14} /> : <Share2 size={14} />}
          <span>{copied ? t('invitation.edit.copied') : t('invitation.edit.copyLink')}</span>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <WhatsappIcon size={16} />
            {t('invitation.sendModal.shareWhatsApp')}
          </a>
        </Button>
      </div>
      <div className="rounded-lg border border-us-border bg-us-surface p-3 inline-block">
        <QrCodePanel url={publicUrl} label={t('invitation.edit.qrLabel')} size={128} />
      </div>
    </div>
  );
}
