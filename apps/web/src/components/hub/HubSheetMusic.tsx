'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { resolveHostApiError } from '@/lib/guests/host-api-error';

interface Props {
  open: boolean;
  onClose: () => void;
  invitationId: string;
  initialUrl: string;
}

/**
 * 2026-08-18 (Phase 2, hub screen): quick-edit for background music. The
 * editor's music-panel route is identical (uses the same PATCH endpoint
 * with musicUrl validated by parseUserMediaUrl); this sheet only handles
 * the URL path. File upload is intentionally not part of Phase 2 — when
 * the dedicated /api/uploads/audio route exists we'll add it here.
 */
export function HubSheetMusic({ open, onClose, invitationId, initialUrl }: Props) {
  const { t } = useI18n();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setToast(null);
    }
  }, [open, initialUrl]);

  const save = async (next: string | null) => {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicUrl: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resolveHostApiError(data, t, 'invitation.hub.error'));
      }
      setToast({
        kind: 'ok',
        message:
          next === null
            ? t('invitation.hub.musicSheet.removed')
            : t('invitation.hub.musicSheet.saved'),
      });
      if (next !== null) {
        window.setTimeout(() => {
          setToast(null);
          onClose();
        }, 900);
      }
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
      title={t('invitation.hub.musicSheet.title')}
      subtitle={t('invitation.hub.musicSheet.subtitle')}
      footer={
        <div className="hub-share-buttons" style={{ marginTop: 0 }}>
          <button type="button" className="hub-btn" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="hub-btn hub-btn--primary"
            onClick={() => void save(url.trim() || null)}
            disabled={busy}
          >
            {busy ? t('invitation.hub.musicSheet.uploading') : t('invitation.hub.musicSheet.save')}
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
        <label className="hub-field-label">{t('invitation.hub.musicSheet.url')}</label>
        <input
          className="hub-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…mp3"
        />
        <span className="hub-field-hint">{t('invitation.hub.musicSheet.subtitle')}</span>
      </div>

      {initialUrl ? (
        <button
          type="button"
          className="hub-btn hub-btn--negative"
          onClick={() => void save(null)}
          disabled={busy}
        >
          {t('invitation.hub.musicSheet.remove')}
        </button>
      ) : null}
    </HubSheet>
  );
}