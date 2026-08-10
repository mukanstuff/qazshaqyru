'use client';

/**
 * MediaPanel — editor tab for music, gallery photos, and OG card metadata.
 */

import { useCallback, useRef, useState } from 'react';
import { useHtmlEditorStore, useHtmlEditorFields } from '@/lib/templates/html-engine/editor/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music, ImagePlus, X, GripVertical, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/shared/utils';
import { uploadImageFile, uploadMusicFile } from '@/lib/uploads/upload-client';
import { useToast } from '@/components/ui/toaster';

const MUSIC_CATALOG: Array<{ name: string; url: string }> = [
  { name: 'Son Pascal — Мен Сені Сүйемін', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1718e32a6d.mp3' },
];

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-white/30">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-body text-sm text-white/80">{label}</Label>
      {children}
      {hint ? <p className="font-body text-xs text-white/30">{hint}</p> : null}
    </div>
  );
}

function MusicTrackRow({
  name,
  url,
  isActive,
  onSelect,
  onRemove,
}: {
  name: string;
  url: string;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-3 transition-all',
        isActive
          ? 'border-[#16A34A] bg-[#16A34A]/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/60 hover:border-white/30 hover:text-white"
      >
        <Music className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm text-white/80">{name}</p>
        <p className="truncate font-body text-xs text-white/30">{url}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-lg p-1 text-white/30 opacity-0 transition-all hover:bg-white/10 group-hover:opacity-100"
        title="Убрать"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function MediaPanel() {
  const store = useHtmlEditorStore();
  const fields = useHtmlEditorFields();
  const { toast } = useToast();
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [musicStart, setMusicStart] = useState(fields.musicStartSec);
  const [musicEnd, setMusicEnd] = useState(fields.musicEndSec);
  const musicUploadRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);

  const handleMusicUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMusic(true);
    try {
      const result = await uploadMusicFile(file);
      if (result.success && result.url) {
        store.setMusic(result.url, musicStart, musicEnd);
        toast({ title: 'Музыка загружена' });
      } else {
        toast({ title: 'Ошибка загрузки', description: result.error, variant: 'destructive' });
      }
    } finally {
      setUploadingMusic(false);
    }
  }, [musicStart, musicEnd, store, toast]);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (fields.galleryPhotos.length + files.length > 8) {
      toast({ title: 'Максимум 8 фотографий', variant: 'destructive' });
      return;
    }
    setUploadingPhoto(true);
    try {
      for (const file of files) {
        const result = await uploadImageFile(file as File);
        if (result.success && result.url) {
          store.addGalleryPhoto(result.url);
        }
      }
      toast({ title: 'Фотографии загружены' });
    } finally {
      setUploadingPhoto(false);
    }
  }, [fields.galleryPhotos.length, store, toast]);

  return (
    <div className="space-y-8 p-5">
      {/* ── Music ─────────────────────────────────────────────────── */}
      <Section title="Музыка">
        {fields.musicUrl ? (
          <MusicTrackRow
            name="Загруженный трек"
            url={fields.musicUrl}
            isActive
            onSelect={() => {}}
            onRemove={store.clearMusic}
          />
        ) : null}

        <div className="space-y-2">
          {MUSIC_CATALOG.map((track) => (
            <MusicTrackRow
              key={track.url}
              name={track.name}
              url={track.url}
              isActive={fields.musicUrl === track.url}
              onSelect={() => store.setMusic(track.url, 0, 180)}
              onRemove={store.clearMusic}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
          onClick={() => musicUploadRef.current?.click()}
          disabled={uploadingMusic}
        >
          <Music className="h-4 w-4" />
          {uploadingMusic ? 'Загрузка…' : 'Загрузить свою музыку'}
        </Button>
        <input
          ref={musicUploadRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleMusicUpload}
        />

        {fields.musicUrl && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="font-body text-xs text-white/40">Фрагмент (секунды)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 font-body text-xs text-white/30">Начало</p>
                <Input
                  type="number"
                  min={0}
                  value={musicStart}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0;
                    setMusicStart(v);
                    store.setMusic(fields.musicUrl, v, musicEnd);
                  }}
                  className="h-9 rounded-xl border border-white/10 bg-white/5 font-mono text-sm text-white focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                />
              </div>
              <div>
                <p className="mb-1 font-body text-xs text-white/30">Конец</p>
                <Input
                  type="number"
                  min={1}
                  value={musicEnd}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 180;
                    setMusicEnd(v);
                    store.setMusic(fields.musicUrl, musicStart, v);
                  }}
                  className="h-9 rounded-xl border border-white/10 bg-white/5 font-mono text-sm text-white focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ── Gallery ──────────────────────────────────────────────── */}
      <Section title="Галерея">
        <div className="grid grid-cols-2 gap-2">
          {fields.galleryPhotos.map((photo: string, i: number) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Фото ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => store.removeGalleryPhoto(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5">
                <GripVertical className="h-2.5 w-2.5 text-white/60" />
                <span className="font-body text-[10px] text-white/80">{i + 1}</span>
              </div>
            </div>
          ))}

          {fields.galleryPhotos.length < 8 && (
            <button
              type="button"
              onClick={() => photoUploadRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-white/10 text-white/20 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white/40"
            >
              <div className="flex flex-col items-center gap-1.5">
                <ImagePlus className="h-6 w-6" />
                <span className="font-body text-xs">Добавить</span>
              </div>
            </button>
          )}
        </div>
        <input
          ref={photoUploadRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoUpload}
        />
      </Section>

      {/* ── Card metadata (OG tags) ───────────────────────────────── */}
      <Section title="Карточка ссылки">
        <Field
          label="Заголовок карточки"
          hint="Видите в WhatsApp / Telegram под ссылкой. Пусто — имена пары."
        >
          <Input
            value={fields.cardTitle}
            onChange={(e) => store.updateField('cardTitle', e.target.value)}
            placeholder="Свадьба Айдара и Айсулу"
            maxLength={200}
            className="h-10 rounded-xl border border-white/10 bg-white/5 font-body text-sm text-white placeholder:text-white/25 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
          />
        </Field>

        <Field
          label="Описание карточки"
          hint="Текст под заголовком. Пусто — текст приглашения."
        >
          <Input
            value={fields.cardDescription}
            onChange={(e) => store.updateField('cardDescription', e.target.value)}
            placeholder="Дорогие родные и близкие, приглашаем вас на наше торжество!"
            maxLength={500}
            className="h-10 rounded-xl border border-white/10 bg-white/5 font-body text-sm text-white placeholder:text-white/25 focus:border-[#16A34A] focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
          />
        </Field>

        <Field
          label="Картинка карточки"
          hint="OG image. Пусто — картинка шаблона."
        >
          <div className="flex items-center gap-3">
            {fields.cardImageUrl ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fields.cardImageUrl} alt="OG" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => store.updateField('cardImageUrl', '')}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => photoUploadRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Загрузить
            </Button>
          </div>
        </Field>
      </Section>
    </div>
  );
}
