'use client';

import { useCallback, useRef, useState } from 'react';
import { Music, Pause, Play, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { uploadMusicFile } from '@/lib/uploads/upload-client';
import type { InvitationCanvasDocument, MusicPlayerElement } from '@/lib/canvas/types';
import { updateElement } from '@/lib/canvas/mutations';

interface Props {
  document: InvitationCanvasDocument;
  invitationId?: string;
  onDocumentChange: (next: InvitationCanvasDocument) => void;
}

// Real, verified tracks self-hosted at /assets/music (not hotlinked — the
// previous catalog pointed at invented Pixabay CDN URLs that all 403'd,
// silently breaking every preview/select in this tab. Each entry below was
// downloaded and its source video verified by title/uploader before being
// added — see session notes 2026-08-26. Self-hosting avoids the same class
// of link-rot bug recurring with a different third-party host.
const PLACEHOLDER_CATALOG: Array<{ id: string; title: string; url: string }> = [
  {
    id: 'peder-helland-always',
    title: 'Peder B. Helland - Always',
    url: '/assets/music/peder-helland-always.mp3',
  },
  {
    id: 'ukili-kamshat-kyz-syny',
    title: 'Азия тобы - Үкілі Кәмшат / Қыз сыны',
    url: '/assets/music/ukili-kamshat-kyz-syny.mp3',
  },
  {
    id: 'zhan-syrym-ayaulym',
    title: 'Жан сырым (Аяулым) - Qurmash Makhan',
    url: '/assets/music/zhan-syrym-ayaulym.mp3',
  },
  {
    id: 'kazybek-kuraiysh-taptym-au-seni',
    title: 'Казыбек Курайыш - Таптым-ау сені',
    url: '/assets/music/kazybek-kuraiysh-taptym-au-seni.mp3',
  },
  {
    id: 'kyz-uzatu-zhanbolat-zhazira',
    title: 'Қыз ұзату - Жанболат & Жазира',
    url: '/assets/music/kyz-uzatu-zhanbolat-zhazira.mp3',
  },
  {
    id: 'miras-zhugunusov-zymyran',
    title: 'Мирас Жугунусов - Зымыран',
    url: '/assets/music/miras-zhugunusov-zymyran.mp3',
  },
  {
    id: 'ukili-kamshat-dombyra',
    title: 'Үкілі камшат - Домбыра',
    url: '/assets/music/ukili-kamshat-dombyra.mp3',
  },
];

/**
 * "Music" tab.
 *
 * Edits the first `music` element found in the document. If there are
 * several (multi-track template), only the first is exposed in this
 * revision — multiple-music editing is out of scope.
 *
 * - Custom upload via the music upload endpoint.
 * - Curated catalog of popular Kazakh tracks, self-hosted at
 *   /assets/music, with inline preview buttons.
 */
export function EditorSheetTabMusic({
  document,
  invitationId,
  onDocumentChange,
}: Props) {
  const { t, locale } = useI18n();
  const isRu = locale === 'ru';
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const musicEl: MusicPlayerElement | undefined = document.elements.find(
    (e): e is MusicPlayerElement => e.type === 'music'
  );

  const patchEl = useCallback(
    (patch: Partial<MusicPlayerElement>) => {
      if (!musicEl) return;
      onDocumentChange(updateElement(document, musicEl.id, patch));
    },
    [document, musicEl, onDocumentChange]
  );

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const res = await uploadMusicFile(file, invitationId);
      if (!res.success || !res.url) {
        throw new Error(res.message || t('common.uploadError'));
      }
      patchEl({ audioSrc: res.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('common.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPreviewingId(null);
  };

  const togglePreview = (trackId: string, url: string) => {
    if (previewingId === trackId) {
      stopPreview();
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => setPreviewingId(null));
      audioRef.current.addEventListener('error', () => setPreviewingId(null));
    }
    audioRef.current.src = url;
    audioRef.current.play().catch(() => setPreviewingId(null));
    setPreviewingId(trackId);
  };

  if (!musicEl) {
    return (
      <p className="editor-sheet-empty">
        {t('invitation.edit.canvas.sheet.musicEmpty')}
      </p>
    );
  }

  return (
    <div className="editor-sheet-section-stack">
      <div className="editor-sheet-section">
        <h3 className="editor-sheet-section-title">{isRu ? 'Свой трек' : 'Өз трегіңіз'}</h3>
        <label className="editor-field">
          <span className="editor-field-label">{t('invitation.edit.canvas.sheet.trackNamePlaceholder')}</span>
          <input
            type="text"
            className="canvas-inspector-input is-block"
            value={musicEl.title ?? ''}
            placeholder={isRu ? 'Нежная мелодия' : 'Нәзік әуен'}
            onChange={(e) => patchEl({ title: e.target.value })}
          />
        </label>
        <label className="editor-field">
          <span className="editor-field-label">{t('invitation.edit.canvas.sheet.trackUrlPlaceholder')}</span>
          <input
            type="text"
            className="canvas-inspector-input is-block"
            value={musicEl.audioSrc ?? ''}
            placeholder="https://…mp3"
            onChange={(e) => patchEl({ audioSrc: e.target.value })}
          />
        </label>
        <label className="editor-field">
          <span className="editor-field-label">Файл</span>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
            className="editor-file-input"
          />
        </label>
        {uploading && <p className="editor-sheet-hint">{isRu ? 'Загрузка…' : 'Жүктелуде…'}</p>}
        {uploadError && <p className="editor-sheet-error">{uploadError}</p>}
      </div>

      <div className="editor-sheet-section">
        <h3 className="editor-sheet-section-title">Каталог</h3>
        <p className="editor-sheet-hint">
          {t('invitation.edit.canvas.sheet.musicCatalogNotice')}
        </p>
        <div className="editor-music-list">
          {PLACEHOLDER_CATALOG.map((track) => {
            const isPreviewing = previewingId === track.id;
            const isCurrent = musicEl.audioSrc === track.url;
            return (
              <div key={track.id} className="editor-music-row">
                <Music size={16} aria-hidden="true" />
                <span className="editor-music-title">{track.title}</span>
                <button
                  type="button"
                  className="editor-icon-btn"
                  onClick={() => togglePreview(track.id, track.url)}
                  aria-label={
                    isPreviewing
                      ? t('invitation.edit.canvas.sheet.stopPreview')
                      : t('invitation.edit.canvas.sheet.preview')
                  }
                  title={
                    isPreviewing
                      ? t('invitation.edit.canvas.sheet.stopPreview')
                      : t('invitation.edit.canvas.sheet.preview')
                  }
                >
                  {isPreviewing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  type="button"
                  className={isCurrent ? 'editor-music-pick is-active' : 'editor-music-pick'}
                  onClick={() => patchEl({ audioSrc: track.url, title: track.title })}
                >
                  {t('invitation.edit.canvas.sheet.select')}
                </button>
              </div>
            );
          })}
        </div>
        {musicEl.audioSrc && (
          <button
            type="button"
            className="editor-link-btn"
            onClick={() => patchEl({ audioSrc: '' })}
          >
            <X size={14} aria-hidden="true" />
            {isRu ? 'Убрать музыку' : 'Музыканы алып тастау'}
          </button>
        )}
      </div>
    </div>
  );
}
