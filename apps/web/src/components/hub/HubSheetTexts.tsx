'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { resolveHostApiError } from '@/lib/guests/host-api-error';

interface TextsState {
  greeting: string;
  intro: string;
  details: string;
  closing: string;
  dressCode: string;
  groomName: string;
  brideName: string;
  eventPlace: string;
  address: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  invitationId: string;
  initial: TextsState;
}

/**
 * 2026-08-18 (Phase 2, hub screen): quick-edit for the textual content the
 * user cares about most. Per spec item 2: greeting / intro / details /
 * closing / dressCode / couple-names.first / couple-names.second /
 * eventPlace / address. Everything else stays in the canvas editor.
 */
export function HubSheetTexts({ open, onClose, invitationId, initial }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<TextsState>(initial);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  // Reset draft whenever the sheet opens with new initial values.
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
          customText: {
            greeting: draft.greeting,
            intro: draft.intro,
            details: draft.details,
            closing: draft.closing,
            dressCode: draft.dressCode,
            groomName: draft.groomName,
            brideName: draft.brideName,
            eventPlace: draft.eventPlace,
            address: draft.address,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resolveHostApiError(data, t, 'invitation.hub.textsSheet.error'));
      }
      setToast({ kind: 'ok', message: t('invitation.hub.textsSheet.saved') });
      // Close shortly after success so the user sees the toast.
      window.setTimeout(() => {
        setToast(null);
        onClose();
      }, 900);
    } catch (e) {
      setToast({
        kind: 'err',
        message: e instanceof Error ? e.message : t('invitation.hub.textsSheet.error'),
      });
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof TextsState, label: string, multiline = false) => (
    <div className="hub-field">
      <label className="hub-field-label">{label}</label>
      {multiline ? (
        <textarea
          className="hub-textarea"
          value={draft[key]}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
          maxLength={multiline ? 2000 : 500}
        />
      ) : (
        <input
          className="hub-input"
          value={draft[key]}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
          maxLength={500}
        />
      )}
    </div>
  );

  return (
    <HubSheet
      open={open}
      onClose={onClose}
      title={t('invitation.hub.textsSheet.title')}
      subtitle={t('invitation.hub.textsSheet.subtitle')}
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
            {busy ? t('common.saving') : t('invitation.hub.textsSheet.save')}
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

      {field('greeting', t('invitation.hub.textsSheet.greeting'))}
      {field('intro', t('invitation.hub.textsSheet.intro'), true)}
      {field('details', t('invitation.hub.textsSheet.details'), true)}
      {field('closing', t('invitation.hub.textsSheet.closing'), true)}
      {field('dressCode', t('invitation.hub.textsSheet.dressCode'))}
      <div className="hub-date-row">
        <div style={{ flex: 1 }}>
          {field('groomName', t('invitation.hub.textsSheet.firstName'))}
        </div>
        <div style={{ flex: 1 }}>
          {field('brideName', t('invitation.hub.textsSheet.secondName'))}
        </div>
      </div>
      {field('eventPlace', t('invitation.hub.textsSheet.eventPlace'))}
      {field('address', t('invitation.hub.textsSheet.address'))}
    </HubSheet>
  );
}