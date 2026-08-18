'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  invitationId: string;
}

/**
 * 2026-08-18 (Phase 2, hub screen): reminders sheet. Phase 2 ships WhatsApp
 * only — the spec (item 6) requires an explicit label about that. We
 * delegate the actual send to the existing POST /remind endpoint which
 * already returns per-guest WA share links that the user copies and sends
 * manually.
 */
export function HubSheetReminders({ open, onClose, invitationId }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  const onSend = async () => {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await res.json().catch(() => ({}))) as {
        guests?: Array<{ name: string; whatsappLink: string | null }>;
      };
      if (!res.ok) {
        throw new Error(
          (data as { error?: string; message?: string }).message ||
            t('invitation.hub.error')
        );
      }
      const links = (data.guests ?? [])
        .filter((g) => g.whatsappLink)
        .map((g) => `${g.name}: ${g.whatsappLink}`)
        .join('\n');
      if (!links) {
        setToast({ kind: 'ok', message: t('invitation.hub.remindersSheet.empty') });
        return;
      }
      try {
        await navigator.clipboard.writeText(links);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = links;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setToast({ kind: 'ok', message: t('invitation.hub.remindersSheet.success') });
    } catch (e) {
      setToast({
        kind: 'err',
        message: e instanceof Error ? e.message : t('invitation.hub.error'),
      });
    } finally {
      setBusy(false);
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
            onClick={onSend}
            disabled={busy}
          >
            <MessageCircle size={16} aria-hidden="true" />
            {busy ? t('invitation.hub.remindersSheet.sending') : t('invitation.hub.remindersSheet.send')}
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
    </HubSheet>
  );
}