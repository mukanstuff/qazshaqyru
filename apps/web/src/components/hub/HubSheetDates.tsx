'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { resolveHostApiError } from '@/lib/guests/host-api-error';

interface DatesState {
  eventDate: string; // yyyy-MM-dd
  eventTime: string; // HH:mm
  eventPlace: string;
  address: string;
  eventTimezone: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  invitationId: string;
  initial: DatesState;
}

function toIsoDate(yyyyMmDd: string): string {
  if (!yyyyMmDd) return new Date().toISOString();
  // Append noon to avoid TZ drift when only a calendar date is chosen.
  return new Date(`${yyyyMmDd}T12:00:00`).toISOString();
}

/**
 * 2026-08-18 (Phase 2, hub screen): edit date / time / place / address.
 * Backed by the same PATCH /api/invitations/[id] the editor already uses;
 * the countdown widget on the canvas rebuilds on next render.
 */
export function HubSheetDates({ open, onClose, invitationId, initial }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<DatesState>(initial);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  const onSave = async () => {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventDate: toIsoDate(draft.eventDate),
          eventTime: draft.eventTime || null,
          eventPlace: draft.eventPlace || null,
          address: draft.address || null,
          eventTimezone: draft.eventTimezone || 'Asia/Almaty',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resolveHostApiError(data, t, 'invitation.hub.error'));
      }
      setToast({ kind: 'ok', message: t('invitation.hub.datesSheet.saved') });
      window.setTimeout(() => {
        setToast(null);
        onClose();
      }, 900);
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
      title={t('invitation.hub.datesSheet.title')}
      subtitle={t('invitation.hub.datesSheet.subtitle')}
      footer={
        <div className="hub-share-buttons" style={{ marginTop: 0 }}>
          <button type="button" className="hub-btn" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="hub-btn hub-btn--primary"
            onClick={onSave}
            disabled={busy}
          >
            {busy ? t('common.saving') : t('invitation.hub.datesSheet.save')}
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

      <div className="hub-date-row">
        <div style={{ flex: 1 }}>
          <div className="hub-field">
            <label className="hub-field-label">{t('invitation.hub.datesSheet.date')}</label>
            <input
              type="date"
              className="hub-input"
              value={draft.eventDate}
              onChange={(e) => setDraft((d) => ({ ...d, eventDate: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="hub-field">
            <label className="hub-field-label">{t('invitation.hub.datesSheet.time')}</label>
            <input
              type="time"
              className="hub-input"
              value={draft.eventTime}
              onChange={(e) => setDraft((d) => ({ ...d, eventTime: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="hub-field">
        <label className="hub-field-label">{t('invitation.hub.datesSheet.place')}</label>
        <input
          className="hub-input"
          value={draft.eventPlace}
          onChange={(e) => setDraft((d) => ({ ...d, eventPlace: e.target.value }))}
          maxLength={300}
        />
      </div>

      <div className="hub-field">
        <label className="hub-field-label">{t('invitation.hub.datesSheet.address')}</label>
        <input
          className="hub-input"
          value={draft.address}
          onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
          maxLength={500}
        />
      </div>

      <div className="hub-field">
        <label className="hub-field-label">{t('invitation.hub.datesSheet.timezone')}</label>
        <select
          className="hub-select"
          value={draft.eventTimezone}
          onChange={(e) => setDraft((d) => ({ ...d, eventTimezone: e.target.value }))}
        >
          <option value="Asia/Almaty">Asia/Almaty</option>
          <option value="Asia/Astana">Asia/Astana</option>
          <option value="Europe/Moscow">Europe/Moscow</option>
          <option value="UTC">UTC</option>
        </select>
      </div>
    </HubSheet>
  );
}