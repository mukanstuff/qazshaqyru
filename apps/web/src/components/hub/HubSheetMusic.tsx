'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useI18n } from '@/i18n';
import { HubSheet } from '@/components/hub/HubSheet';
import { uploadMusicFile } from '@/lib/uploads/upload-client';
import { resolveHostApiError } from '@/lib/guests/host-api-error';
import { fetchInvitationCanvas, saveInvitationCanvas } from '@/lib/canvas/hub-canvas-client';
import type { MusicPlayerElement } from '@/lib/canvas/types';

interface Props {
  open: boolean;
  onClose: () => void;
  invitationId: string;
  initialUrl: string;
}

const MAX_SIZE_MB = 20;
const ACCEPT = 'audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/x-m4a';

/**
 * 2026-08-18 (Phase 2, hub screen): quick-edit for background music.
 *
 * Writes directly to the canvas document's `music` element(s) — the player
 * guests actually see reads `el.audioSrc`, not `Invitation.musicUrl`.
 * Removing sets the element `hidden: true` so the player disappears from
 * the guest page instead of silently falling back to a curated default
 * track (its behaviour when `audioSrc` is merely empty).
 */
export function HubSheetMusic({ open, onClose, invitationId, initialUrl }: Props) {
  const { t } = useI18n();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      const { document, updatedAt } = await fetchInvitationCanvas(invitationId);
      let touched = false;
      const elements = document.elements.map((el) => {
        if (el.type !== 'music') return el;
        touched = true;
        const music = el as MusicPlayerElement;
        return next
          ? { ...music, audioSrc: next, hidden: false }
          : { ...music, audioSrc: undefined, hidden: true };
      });
      if (!touched) {
        throw new Error(t('invitation.hub.musicSheet.noMusicElement'));
      }
      await saveInvitationCanvas(invitationId, { ...document, elements }, updatedAt);
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

  const onUpload = async (file: File) => {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setToast({
        kind: 'err',
        message: t('invitation.hub.musicSheet.fileTooLarge', { max: MAX_SIZE_MB }),
      });
      return;
    }
    setUploading(true);
    setToast(null);
    try {
      const res = await uploadMusicFile(file, invitationId);
      if (!res.success || !res.url) {
        throw new Error(
          res.message || t('invitation.hub.musicSheet.uploadFailed')
        );
      }
      setUrl(res.url);
      await save(res.url);
    } catch (e) {
      setToast({
        kind: 'err',
        message: e instanceof Error ? e.message : t('invitation.hub.musicSheet.uploadFailed'),
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          <button type="button" className="hub-btn" onClick={onClose} disabled={busy || uploading}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="hub-btn hub-btn--primary"
            onClick={() => void save(url.trim() || null)}
            disabled={busy || uploading}
          >
            {busy ? t('common.saving') : t('invitation.hub.musicSheet.save')}
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

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onUpload(f);
        }}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <button
        type="button"
        className="hub-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || busy}
        style={{ width: '100%' }}
      >
        {uploading ? (
          <>
            <Loader2 size={14} aria-hidden="true" />
            {t('invitation.hub.musicSheet.uploading')}
          </>
        ) : (
          <>
            <Upload size={14} aria-hidden="true" />
            {t('invitation.hub.musicSheet.upload')} ({MAX_SIZE_MB} MB)
          </>
        )}
      </button>

      <div className="hub-field" style={{ marginTop: 14 }}>
        <label className="hub-field-label">{t('invitation.hub.musicSheet.url')}</label>
        <input
          className="hub-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…mp3"
        />
        {/* The sheet's own subtitle already says this, two inches above. It was
            printed a second time under the field, so the sheet read "the track
            that plays when the page opens" twice in one screen. */}
      </div>

      {initialUrl ? (
        <button
          type="button"
          className="hub-btn hub-btn--negative"
          onClick={() => void save(null)}
          disabled={busy || uploading}
        >
          {t('invitation.hub.musicSheet.remove')}
        </button>
      ) : null}
    </HubSheet>
  );
}
