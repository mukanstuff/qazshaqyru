'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { fetchInvitationCanvas, saveInvitationCanvas } from '@/lib/canvas/hub-canvas-client';
import { applyPlaceholderFields } from '@/lib/canvas/apply-field-placeholders';
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
 *
 * Writes directly to the canvas document — the countdown, the venue text
 * and the map card guests actually see are canvas elements, not the
 * `Invitation.eventDate` / `eventPlace` columns. Those columns get derived
 * back from canvas automatically on save (see deriveInvitationFieldsFromCanvas)
 * so the .ics export and OG image stay in sync too.
 */
export function HubSheetDates({ open, onClose, invitationId, initial }: Props) {
  const { t, locale } = useI18n();
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
      const { document, updatedAt } = await fetchInvitationCanvas(invitationId);
      const next = applyPlaceholderFields(
        document,
        {
          eventDateIso: toIsoDate(draft.eventDate),
          eventTime: draft.eventTime || undefined,
          eventPlace: draft.eventPlace || undefined,
          address: draft.address || undefined,
        },
        locale === 'kz' ? 'kz' : 'ru'
      );
      await saveInvitationCanvas(invitationId, next, updatedAt);

      // Timezone has no canvas equivalent (it's a display-agnostic document) —
      // it stays a plain Invitation column, saved alongside the canvas write.
      const tzRes = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventTimezone: draft.eventTimezone || 'Asia/Almaty' }),
      });
      if (!tzRes.ok) {
        const tzData = await tzRes.json().catch(() => ({}));
        throw new Error(resolveHostApiError(tzData, t, 'invitation.hub.error'));
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
              className="hub-input"
              type="date"
              value={draft.eventDate}
              onChange={(e) => setDraft((d) => ({ ...d, eventDate: e.target.value }))}
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="hub-field">
            <label className="hub-field-label">{t('invitation.hub.datesSheet.time')}</label>
            <input
              className="hub-input"
              type="time"
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
        <span className="hub-field-hint">{t('invitation.hub.datesSheet.addressHint')}</span>
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
