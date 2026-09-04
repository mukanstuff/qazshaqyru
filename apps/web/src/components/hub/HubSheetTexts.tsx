'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { resolveHostApiError } from '@/lib/guests/host-api-error';
import { fetchInvitationCanvas, saveInvitationCanvas } from '@/lib/canvas/hub-canvas-client';
import { applyPlaceholderFields } from '@/lib/canvas/apply-field-placeholders';

interface TextsState {
  groomName: string;
  brideName: string;
  greeting: string;
  dressCode: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  invitationId: string;
  initial: TextsState;
}

/**
 * 2026-08-18 (Phase 2, hub screen), rewritten 2026-08-29: quick-edit for the
 * text content that actually has somewhere to land on the canvas — the
 * couple's names, the greeting line and the dress code. Everything else
 * (greeting body / program / footer) never had a canvas element to bind to
 * on any live template and was dropped rather than kept as a form that
 * silently wrote to a column nothing renders.
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
      const { document, updatedAt } = await fetchInvitationCanvas(invitationId);
      const next = applyPlaceholderFields(document, {
        groomName: draft.groomName || undefined,
        brideName: draft.brideName || undefined,
        greetingText: draft.greeting || undefined,
        dressCode: draft.dressCode || undefined,
      });
      await saveInvitationCanvas(invitationId, next, updatedAt);
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

  const field = (key: keyof TextsState, label: string) => (
    <div className="hub-field">
      <label className="hub-field-label">{label}</label>
      <input
        className="hub-input"
        value={draft[key]}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        maxLength={500}
      />
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

      <div className="hub-date-row">
        <div style={{ flex: 1 }}>
          {field('groomName', t('invitation.hub.textsSheet.firstName'))}
        </div>
        <div style={{ flex: 1 }}>
          {field('brideName', t('invitation.hub.textsSheet.secondName'))}
        </div>
      </div>
      {field('greeting', t('invitation.hub.textsSheet.greeting'))}
      {field('dressCode', t('invitation.hub.textsSheet.dressCode'))}
    </HubSheet>
  );
}
