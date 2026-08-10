'use client';

/**
 * MediaPanel — music, gallery photos, OG card metadata.
 */

import { useCallback, useRef, useState } from 'react';
import { useHtmlEditorStore, useHtmlEditorFields } from '@/lib/templates/html-engine/editor/store';
import { uploadImageFile, uploadMusicFile } from '@/lib/uploads/upload-client';
import { useToast } from '@/components/ui/toaster';
import { Music, X, ImagePlus } from 'lucide-react';
import { PaneSection, PaneField, TextInput, TextArea, UploadZone, GalleryGrid } from '../primitives';

const MUSIC_CATALOG: Array<{ name: string; subtitle: string; url: string }> = [
  {
    name: 'Son Pascal — Мен Сені Сүйемін',
    subtitle: 'Qazaq Lyrics · 03:05',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1718e32a6d.mp3',
  },
];

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MediaPanel() {
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();
  const { toast } = useToast();
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingCard, setUploadingCard] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  const handleMusicUpload = useCallback(
    async (file: File) => {
      setUploadingMusic(true);
      try {
        const result = await uploadMusicFile(file);
        if (result.success && result.url) {
          store.setMusic(result.url, fields.musicStartSec, fields.musicEndSec);
          toast({ title: 'Музыка загружена' });
        } else {
          toast({ title: 'Ошибка загрузки', description: result.error, variant: 'destructive' });
        }
      } finally {
        setUploadingMusic(false);
      }
    },
    [store, fields.musicStartSec, fields.musicEndSec, toast],
  );

  const handleGalleryUpload = useCallback(
    async (file: File) => {
      if (fields.galleryPhotos.length >= 8) {
        toast({ title: 'Максимум 8 фотографий', variant: 'destructive' });
        return;
      }
      setUploadingPhotos(true);
      try {
        const result = await uploadImageFile(file);
        if (result.success && result.url) {
          store.addGalleryPhoto(result.url);
        }
      } finally {
        setUploadingPhotos(false);
      }
    },
    [store, fields.galleryPhotos.length, toast],
  );

  const handleCardImageUpload = useCallback(
    async (file: File) => {
      setUploadingCard(true);
      try {
        const result = await uploadImageFile(file);
        if (result.success && result.url) {
          store.updateField('cardImageUrl', result.url);
        }
      } finally {
        setUploadingCard(false);
      }
    },
    [store, toast],
  );

  return (
    <div>
      <PaneSection title="Музыка">
        {fields.musicUrl ? (
          <div className="editor-pane-music-track" aria-pressed="true">
            <div className="editor-pane-music-track__icon">
              <Music className="h-4 w-4" />
            </div>
            <div className="editor-pane-music-track__meta">
              <div className="editor-pane-music-track__name">Текущий трек</div>
              <div className="editor-pane-music-track__sub">
                {fmt(fields.musicStartSec)} — {fmt(fields.musicEndSec)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => store.clearMusic()}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white"
              aria-label="Убрать музыку"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          {MUSIC_CATALOG.map((track) => (
            <button
              key={track.url}
              type="button"
              aria-pressed={fields.musicUrl === track.url}
              onClick={() => store.setMusic(track.url, 0, 180)}
              className="editor-pane-music-track"
            >
              <div className="editor-pane-music-track__icon">
                <Music className="h-4 w-4" />
              </div>
              <div className="editor-pane-music-track__meta">
                <div className="editor-pane-music-track__name">{track.name}</div>
                <div className="editor-pane-music-track__sub">{track.subtitle}</div>
              </div>
            </button>
          ))}
        </div>

        <UploadZone
          onUpload={handleMusicUpload}
          uploading={uploadingMusic}
          accept="audio/*"
          label="Загрузить свою музыку"
        />
        <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" />

        {fields.musicUrl ? (
          <div className="editor-pane-card">
            <div className="editor-pane-card__title">Фрагмент</div>
            <div className="editor-pane-row">
              <PaneField label="Начало">
                <TextInput
                  value={String(fields.musicStartSec)}
                  onChange={(v) => {
                    const n = Math.max(0, parseInt(v) || 0);
                    store.setMusic(fields.musicUrl, n, fields.musicEndSec);
                  }}
                  type="number"
                  inputMode="numeric"
                />
              </PaneField>
              <PaneField label="Конец">
                <TextInput
                  value={String(fields.musicEndSec)}
                  onChange={(v) => {
                    const n = Math.max(1, parseInt(v) || 180);
                    store.setMusic(fields.musicUrl, fields.musicStartSec, n);
                  }}
                  type="number"
                  inputMode="numeric"
                />
              </PaneField>
            </div>
            <p className="editor-pane-info">От {fmt(fields.musicStartSec)} до {fmt(fields.musicEndSec)}</p>
          </div>
        ) : null}
      </PaneSection>

      <PaneSection
        title={`Галерея · ${fields.galleryPhotos.length}/8`}
        action={
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="editor-btn editor-btn--ghost editor-btn--icon"
            aria-label="Добавить фото"
            title="Добавить"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
        }
      >
        <GalleryGrid
          urls={fields.galleryPhotos}
          onAdd={() => galleryInputRef.current?.click()}
          onRemove={(i) => store.removeGalleryPhoto(i)}
        />
        <input
          id="gallery-upload-trigger"
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            for (const file of files) {
              await handleGalleryUpload(file);
            }
            if (galleryInputRef.current) galleryInputRef.current.value = '';
          }}
        />
        <p className="editor-pane-info">Фото появятся в приглашении по порядку</p>
      </PaneSection>

      <PaneSection title="Карточка ссылки (WhatsApp / Telegram)">
        <PaneField label="Заголовок" hint="Под ссылкой в мессенджере">
          <TextInput
            value={fields.cardTitle}
            onChange={(v) => store.updateField('cardTitle', v)}
            placeholder="Свадьба Айдара и Айсулу"
            maxLength={200}
          />
        </PaneField>
        <PaneField label="Описание">
          <TextArea
            value={fields.cardDescription}
            onChange={(v) => store.updateField('cardDescription', v)}
            placeholder="Дорогие родные и близкие, приглашаем вас на наше торжество!"
            maxLength={500}
          />
        </PaneField>
        <PaneField label="Картинка">
          {fields.cardImageUrl ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fields.cardImageUrl}
                alt="OG"
                className="h-16 w-16 rounded-lg border border-white/10 object-cover"
              />
              <button
                type="button"
                onClick={() => store.updateField('cardImageUrl', '')}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white"
                aria-label="Удалить картинку"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <UploadZone
              onUpload={handleCardImageUpload}
              uploading={uploadingCard}
              accept="image/*"
              label="Загрузить картинку"
            />
          )}
          <input ref={cardInputRef} type="file" accept="image/*" className="hidden" />
        </PaneField>
      </PaneSection>
    </div>
  );
}