'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Copy, MessageCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  invitationId: string;
}

type ReminderGuest = {
  id: string;
  name: string;
  phone: string | null;
  whatsappLink: string | null;
};

/**
 * Reminders for guests who have not answered yet.
 *
 * Two things this sheet used to get wrong:
 *
 *  1. It said "Отправим сообщение" / "Напоминания отправлены". Nothing is sent —
 *     the app has no messaging channel. `POST /remind` returns per-guest
 *     WhatsApp deep links, and the sheet copied them to the clipboard as one
 *     blob of "Имя: ссылка" lines. So the owner pressed "Отправить", read
 *     "Напоминания отправлены", and believed their guests had been contacted.
 *  2. It never mentioned that `/remind` reissues tokens (`reissue: true`), so
 *     preparing a reminder silently invalidates every personal link already
 *     sitting in a guest's WhatsApp. That is a real consequence and the owner
 *     has to be told before they press the button, not after.
 *
 * Now: the button prepares links, the guests are listed with a WhatsApp button
 * each (the same affordance as the guests sheet), "copy all" stays as a
 * fallback, and the rotation warning is shown up front.
 */
export function HubSheetReminders({ open, onClose, invitationId }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [guests, setGuests] = useState<ReminderGuest[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  const onPrepare = async () => {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/remind`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await res.json().catch(() => ({}))) as {
        guests?: ReminderGuest[];
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || t('invitation.hub.error'));
      }
      const list = data.guests ?? [];
      setGuests(list);
      setToast({
        kind: 'ok',
        message:
          list.length === 0
            ? t('invitation.hub.remindersSheet.empty')
            : t('invitation.hub.remindersSheet.success'),
      });
    } catch (e) {
      setToast({
        kind: 'err',
        message: e instanceof Error ? e.message : t('invitation.hub.error'),
      });
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    const text = (guests ?? [])
      .filter((g) => g.whatsappLink)
      .map((g) => `${g.name}: ${g.whatsappLink}`)
      .join('\n');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — every link is still reachable as a button below */
    }
  };

  return (
    <HubSheet
      open={open}
      onClose={onClose}
      title={t('invitation.hub.remindersSheet.title')}
      subtitle={t('invitation.hub.remindersSheet.subtitle')}
      footer={
        <div className="hub-share-buttons" style={{ marginTop: 0 }}>
          <button type="button" className="hub-btn" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="hub-btn hub-btn--primary"
            onClick={() => void onPrepare()}
            disabled={busy}
          >
            <MessageCircle size={16} aria-hidden="true" />
            {busy
              ? t('invitation.hub.remindersSheet.sending')
              : t('invitation.hub.remindersSheet.send')}
          </button>
        </div>
      }
    >
      {toast ? (
        <div
          className={
            toast.kind === 'ok'
              ? 'hub-sheet-toast hub-sheet-toast--ok'
              : 'hub-sheet-toast hub-sheet-toast--err'
          }
        >
          {toast.message}
        </div>
      ) : null}

      <div className="hub-field">
        <span className="hub-field-label">{t('invitation.hub.remindersSheet.waOnlyLabel')}</span>
        <span className="hub-field-hint">{t('invitation.hub.remindersSheet.waOnlyHint')}</span>
      </div>

      <p className="hub-hint" style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <AlertTriangle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{t('invitation.hub.remindersSheet.reissueWarning')}</span>
      </p>

      {guests && guests.length > 0 ? (
        <>
          <div className="hub-share-buttons" style={{ marginBottom: 10 }}>
            <button type="button" className="hub-btn" onClick={() => void copyAll()}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied
                ? t('invitation.hub.remindersSheet.copied')
                : t('invitation.hub.remindersSheet.copyAll')}
            </button>
          </div>
          <div className="hub-guest-list">
            {guests.map((g) => (
              <div className="hub-guest-row" key={g.id}>
                <div style={{ minWidth: 0 }}>
                  <div className="hub-guest-name">{g.name}</div>
                  {g.phone ? <div className="hub-guest-meta">{g.phone}</div> : null}
                </div>
                <div className="hub-guest-actions">
                  {g.whatsappLink ? (
                    <a
                      className="hub-guest-link-btn"
                      href={g.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle size={13} aria-hidden="true" />
                      {t('invitation.hub.remindersSheet.openWhatsapp')}
                    </a>
                  ) : (
                    <span className="hub-guest-link-note">
                      {t('invitation.hub.remindersSheet.noPhone')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </HubSheet>
  );
}
