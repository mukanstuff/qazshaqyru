'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  Copy,
  Download,
  MessageCircle,
  QrCode,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { QrCodePanel } from '@/components/shared/QrCodePanel';
import { SendInvitesModal } from '@/components/publish/SendInvitesModal';
import {
  buildInviteShareMessage,
  buildPublicInviteUrl,
  buildWhatsAppShareUrl,
} from '@/lib/invitations/share-url';

interface PostPublishShareScreenProps {
  invitationId: string;
  invitationSlug: string;
  invitationTitle: string;
  guestCount: number;
  openRsvp: boolean;
  guestOpsUnlocked?: boolean;
  onDismiss: () => void;
  onExportCsv?: () => void;
  onRestaurantLink?: () => void;
  restaurantUrl?: string | null;
  busy?: string | null;
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

/**
 * Post-publish room: share + ops entrypoints in one лента (not a toast modal).
 */
export function PostPublishShareScreen({
  invitationId,
  invitationSlug,
  invitationTitle,
  guestCount,
  openRsvp,
  guestOpsUnlocked = false,
  onDismiss,
  onExportCsv,
  onRestaurantLink,
  restaurantUrl = null,
  busy = null,
}: PostPublishShareScreenProps) {
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
    await copyText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [publicUrl]);

  return (
    <div
      className="min-h-[calc(100vh-4rem)] bg-[var(--us-ivory)]"
      role="region"
      aria-labelledby="post-publish-title"
      data-testid="post-publish-screen"
    >
      <div className="mx-auto w-full max-w-lg space-y-4 p-4 pb-16 sm:p-6">
        <Card className="relative shadow-us-lg">
          <CardHeader className="relative text-center">
            <div
              className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-us-success/15 text-us-success"
              aria-hidden
            >
              <Check size={28} strokeWidth={2.5} />
            </div>
            <CardTitle id="post-publish-title" className="font-display text-2xl">
              {t('postPublish.title')}
            </CardTitle>
            <p className="font-body text-sm text-us-ink-muted">{t('postPublish.subtitle')}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-4 top-4"
              onClick={onDismiss}
              aria-label={t('common.close')}
            >
              <X size={20} />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="break-all rounded-md border border-us-border bg-us-ivory px-3 py-2 font-mono text-xs text-us-ink">
              {publicUrl}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="default" onClick={() => void handleCopy()}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? t('invitation.edit.copied') : t('postPublish.copyLink')}
              </Button>
              <Button variant="outline" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={18} />
                  {t('invitation.sendModal.shareWhatsApp')}
                </a>
              </Button>
            </div>

            <div className="flex justify-center rounded-lg border border-us-border bg-us-ivory p-4">
              <QrCodePanel url={publicUrl} label={t('invitation.edit.qrLabel')} />
            </div>

            <p className="text-center font-body text-sm text-us-ink-muted">
              {openRsvp
                ? t('invitation.edit.postPublishOpenRsvp')
                : t('invitation.edit.postPublishPersonalRsvp')}
            </p>

            <SendInvitesModal
              invitationId={invitationId}
              invitationSlug={invitationSlug}
              invitationTitle={invitationTitle}
              guestCount={guestCount}
              openRsvpEnabled={openRsvp}
            />
          </CardContent>
        </Card>

        <Card className="shadow-us-sm" data-testid="post-publish-ops-room">
          <CardHeader>
            <CardTitle className="font-display text-xl">{t('postPublish.opsTitle')}</CardTitle>
            <p className="font-body text-sm text-us-ink-muted">{t('postPublish.opsSubtitle')}</p>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-12 justify-start gap-2"
              onClick={onDismiss}
              data-testid="post-publish-open-ops"
            >
              <Users size={18} />
              {t('postPublish.opsGuests')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-12 justify-start gap-2"
              onClick={() => onExportCsv?.()}
              data-testid="post-publish-csv"
            >
              <Download size={18} />
              {t('postPublish.opsCsv')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-12 justify-start gap-2"
              onClick={() => onRestaurantLink?.()}
              data-testid="post-publish-restaurant"
            >
              <Building2 size={18} />
              {restaurantUrl ? t('postPublish.opsRestaurantCopied') : t('postPublish.opsRestaurant')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-12 justify-start gap-2"
              onClick={onDismiss}
            >
              <QrCode size={18} />
              {t('postPublish.opsSeating')}
            </Button>
          </CardContent>
          {/* 
            2026-07-30 decision: after template payment, guestOpsUnlocked should be true.
            This hint only shows for unpaid state.
          */}
          {!guestOpsUnlocked ? (
            <p className="px-6 pb-4 font-body text-xs text-us-ink-muted">
              {t('postPublish.unlockFullAccess')}
            </p>
          ) : null}
        </Card>

        <Button type="button" variant="ghost" className="w-full" onClick={onDismiss}>
          {t('postPublish.continueEditing')}
        </Button>
      </div>
    </div>
  );
}
