'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, Copy, Check, Send, Loader2, MessageCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useToast } from '@/components/ui/toaster';
import { buildInviteShareMessage, buildPublicInviteUrl, buildWhatsAppShareUrl } from '@/lib/invitations/share-url';

interface GuestLink {
  id: string;
  name: string;
  phone: string | null;
  inviteUrl: string;
  whatsappLink: string | null;
  alreadySent?: boolean;
}

interface Props {
  invitationId: string;
  invitationSlug: string;
  invitationTitle?: string;
  guestCount: number;
  /** Default true — one public link for all guests. */
  openRsvpEnabled?: boolean;
  onSent?: () => void;
}

export function SendInvitesModal({
  invitationId,
  invitationSlug,
  invitationTitle,
  guestCount,
  openRsvpEnabled = true,
  onSent,
}: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLinks, setGuestLinks] = useState<GuestLink[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [publicCopied, setPublicCopied] = useState(false);
  const [bulkSendIndex, setBulkSendIndex] = useState<number | null>(null);

  const publicInviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/i/${invitationSlug}`;
    return buildPublicInviteUrl(window.location.origin, invitationSlug);
  }, [invitationSlug]);

  const shareText = useMemo(
    () => buildInviteShareMessage(publicInviteUrl, invitationTitle),
    [publicInviteUrl, invitationTitle],
  );

  const whatsappShareUrl = useMemo(() => buildWhatsAppShareUrl(shareText), [shareText]);

  const guestsWithWhatsApp = useMemo(
    () => guestLinks.filter((g) => g.whatsappLink),
    [guestLinks],
  );

  const openPersonalModal = useCallback(
    async (reissue = false) => {
      setLoading(true);
      setOpen(true);
      setBulkSendIndex(null);
      try {
        const res = await fetch(`/api/invitations/${invitationId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reissue }),
        });
        const data = await res.json();
        if (res.ok && data.guests) {
          setGuestLinks(data.guests);
          onSent?.();
        } else {
          toast({
            title: t('invitation.sendModal.errorTitle'),
            description: data.message || t('invitation.sendModal.errorRetry'),
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: t('invitation.sendModal.errorTitle'),
          description: t('invitation.sendModal.errorNetwork'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [invitationId, onSent, toast, t],
  );

  const openShareModal = useCallback(() => {
    setOpen(true);
    setGuestLinks([]);
    setBulkSendIndex(null);
    setLoading(false);
  }, []);

  const openSendToAll = useCallback(() => {
    if (openRsvpEnabled) {
      openShareModal();
      return;
    }
    void openPersonalModal();
  }, [openPersonalModal, openRsvpEnabled, openShareModal]);

  const copyPublicLink = useCallback(() => {
    navigator.clipboard.writeText(publicInviteUrl).catch(() => {});
    setPublicCopied(true);
    setTimeout(() => setPublicCopied(false), 2000);
  }, [publicInviteUrl]);

  const copyLink = useCallback((link: GuestLink) => {
    navigator.clipboard.writeText(link.inviteUrl).catch(() => {});
    setCopied(link.id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const copyAllLinks = useCallback(() => {
    const text = guestLinks.map((g) => `${g.name}: ${g.inviteUrl}`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  }, [guestLinks]);

  const startBulkWhatsApp = useCallback(() => {
    if (guestsWithWhatsApp.length === 0) return;
    setBulkSendIndex(0);
  }, [guestsWithWhatsApp.length]);

  const openCurrentBulkWhatsApp = useCallback(() => {
    if (bulkSendIndex === null) return;
    const guest = guestsWithWhatsApp[bulkSendIndex];
    if (guest?.whatsappLink) {
      window.open(guest.whatsappLink, '_blank', 'noopener,noreferrer');
    }
  }, [bulkSendIndex, guestsWithWhatsApp]);

  const advanceBulkSend = useCallback(() => {
    if (bulkSendIndex === null) return;
    if (bulkSendIndex + 1 >= guestsWithWhatsApp.length) {
      setBulkSendIndex(null);
      toast({ title: t('invitation.sendModal.sendAllDone') });
      return;
    }
    setBulkSendIndex(bulkSendIndex + 1);
  }, [bulkSendIndex, guestsWithWhatsApp.length, toast, t]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setBulkSendIndex(null);
  }, []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={openSendToAll}
        disabled={!openRsvpEnabled && guestCount === 0}
        
      >
        <Send  aria-hidden />
        {openRsvpEnabled ? t('invitation.sendModal.sendAllWhatsApp') : t('invitation.edit.sendToGuests')}
      </button>
    );
  }

  const bulkGuest = bulkSendIndex !== null ? guestsWithWhatsApp[bulkSendIndex] : null;

  return (
    <>
      <div  onClick={closeModal} />
      <div >
        <div  onClick={(e) => e.stopPropagation()}>
          <div >
            <div>
              <h2 >
                {bulkSendIndex !== null
                  ? t('invitation.sendModal.sendAllWhatsApp')
                  : openRsvpEnabled
                    ? t('invitation.sendModal.sendAllWhatsApp')
                    : t('invitation.sendModal.title')}
              </h2>
              <p >
                {bulkSendIndex !== null && bulkGuest
                  ? t('invitation.sendModal.sendAllProgress', {
                      current: String(bulkSendIndex + 1),
                      total: String(guestsWithWhatsApp.length),
                    })
                  : openRsvpEnabled
                    ? t('invitation.sendModal.shareSubtitle')
                    : guestLinks.length > 0
                      ? t('invitation.sendModal.guestsReady', { count: guestLinks.length })
                      : t('invitation.sendModal.loading')}
              </p>
            </div>
            <button type="button"  onClick={closeModal} aria-label={t('common.close')}>
              <X  />
            </button>
          </div>

          <div >
            {bulkSendIndex !== null && bulkGuest ? (
              <div >
                <p >{t('invitation.sendModal.sendAllHint')}</p>
                <p >{bulkGuest.name}</p>
                <p >{bulkGuest.inviteUrl}</p>
                <button type="button"  onClick={openCurrentBulkWhatsApp}>
                  {t('invitation.sendModal.sendAllOpen')}
                </button>
                <button type="button"  onClick={advanceBulkSend}>
                  {bulkSendIndex + 1 >= guestsWithWhatsApp.length
                    ? t('invitation.sendModal.sendAllDone')
                    : t('invitation.sendModal.sendAllNext')}
                </button>
              </div>
            ) : openRsvpEnabled && guestLinks.length === 0 ? (
              <div >
                <p >{t('invitation.sendModal.shareHint')}</p>
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  
                >
                  <MessageCircle  aria-hidden />
                  {t('invitation.sendModal.sendAllWhatsApp')}
                </a>
                <button type="button"  onClick={copyPublicLink}>
                  {publicCopied ? <Check  /> : <Copy  />}
                  {publicCopied ? t('common.copied') : t('invitation.sendModal.copyAll')}
                </button>
                <p >{publicInviteUrl}</p>
                {guestCount > 0 ? (
                  <button
                    type="button"
                    
                    onClick={() => void openPersonalModal()}
                  >
                    {t('invitation.sendModal.advancedPersonalLinks')}
                  </button>
                ) : null}
              </div>
            ) : loading ? (
              <div >
                <Loader2  />
                <span>{t('invitation.sendModal.generating')}</span>
              </div>
            ) : guestLinks.length === 0 ? (
              <div >{t('invitation.sendModal.noGuests')}</div>
            ) : (
              <div >
                {guestLinks.map((g) => (
                  <div key={g.id} >
                    <div >
                      <p >{g.name}</p>
                      <p >{g.inviteUrl}</p>
                    </div>
                    <button type="button" onClick={() => copyLink(g)}  title={t('common.copy')}>
                      {copied === g.id ? <Check  /> : <Copy  />}
                    </button>
                    {g.whatsappLink ? (
                      <a
                        href={g.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        
                        title={t('invitation.sendModal.whatsapp')}
                      >
                        <MessageCircle  />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {guestLinks.length > 0 && !loading && bulkSendIndex === null ? (
            <div >
              {guestLinks.some((g) => !g.inviteUrl.includes('?guest=')) ? (
                <button type="button"  onClick={() => void openPersonalModal(true)}>
                  {t('invitation.sendModal.reissueLinks')}
                </button>
              ) : null}
              <div >
                <button type="button"  onClick={copyAllLinks}>
                  {allCopied ? <Check  /> : <Copy  />}
                  {allCopied ? t('common.copied') : t('invitation.sendModal.copyAll')}
                </button>
                {guestsWithWhatsApp.length > 0 ? (
                  <button type="button"  onClick={startBulkWhatsApp}>
                    {t('invitation.sendModal.sendAllWhatsApp')}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
