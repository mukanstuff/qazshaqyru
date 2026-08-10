'use client';

import { useState } from 'react';
import type { CanvasElementType } from '@/lib/canvas/types';
import { TEMPLATE_SECTIONS, insertSection } from '@/lib/canvas/sections';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

// ─── Section icon map ───────────────────────────────────────────────────────────
const SECTION_ICONS: Record<string, string> = {
  hero: '♥',
  datetime: '📅',
  venue: '📍',
  photo: '📷',
  program: '🕐',
  wishes: '💌',
  rsvp: '✉',
  dresscode: '👔',
  gift: '🎁',
  countdown: '⏱',
  text: '¶',
  hashtag: '#',
  thankyou: '✓',
};

// ─── Category type ──────────────────────────────────────────────────────────────
interface Category {
  id: string;
  labelRu: string;
  labelKz: string;
  items: { type: CanvasElementType; labelRu: string; labelKz: string; icon: string }[];
}

const CATEGORIES: Category[] = [
  {
    id: 'text',
    labelRu: 'Текст',
    labelKz: 'Мәтін',
    items: [
      { type: 'heading', labelRu: 'Заголовок', labelKz: 'Тақырып', icon: 'H' },
      { type: 'text', labelRu: 'Абзац', labelKz: 'Мәтін', icon: '¶' },
      { type: 'couple-names', labelRu: 'Имена пары', labelKz: 'Жұп есімдері', icon: '♥' },
    ],
  },
  {
    id: 'photo',
    labelRu: 'Фото',
    labelKz: 'Фото',
    items: [{ type: 'image', labelRu: 'Фото', labelKz: 'Сурет', icon: '🖼' }],
  },
  {
    id: 'shapes',
    labelRu: 'Фигуры',
    labelKz: 'Пішіндер',
    items: [
      { type: 'shape', labelRu: 'Прямоугольник / круг / звезда', labelKz: 'Төртбұрыш / шеңбер', icon: '▢' },
      { type: 'divider', labelRu: 'Разделитель', labelKz: 'Бөлгіш', icon: '—' },
    ],
  },
  {
    id: 'decor',
    labelRu: 'Декор',
    labelKz: 'Декор',
    items: [{ type: 'ornament', labelRu: 'Ою-өрнек', labelKz: 'Ою-өрнек', icon: '❀' }],
  },
  {
    id: 'blocks',
    labelRu: 'Кнопки и блоки',
    labelKz: 'Батырмалар',
    items: [
      { type: 'button', labelRu: 'Кнопка', labelKz: 'Батырма', icon: '▭' },
      { type: 'qr', labelRu: 'QR-код', labelKz: 'QR', icon: '▦' },
      { type: 'gift', labelRu: 'Подарок (Каспи)', labelKz: 'Сыйлық (Каспи)', icon: '🎁' },
    ],
  },
  {
    id: 'interactive',
    labelRu: 'Интерактив',
    labelKz: 'Интерактив',
    items: [
      { type: 'countdown', labelRu: 'Таймер', labelKz: 'Кері санақ', icon: '⏱' },
      { type: 'rsvp-form', labelRu: 'Форма RSVP', labelKz: 'RSVP формасы', icon: '✉' },
      { type: 'wishes', labelRu: 'Пожелания', labelKz: 'Тілектер', icon: '💌' },
      { type: 'program', labelRu: 'Программа', labelKz: 'Бағдарлама', icon: '🕐' },
      { type: 'map', labelRu: 'Карта', labelKz: 'Карта', icon: '📍' },
      { type: 'music', labelRu: 'Музыка', labelKz: 'Музыка', icon: '🎵' },
    ],
  },
  {
    id: 'media',
    labelRu: 'Медиа',
    labelKz: 'Медиа',
    items: [
      { type: 'lottie', labelRu: 'Lottie-анимация', labelKz: 'Lottie', icon: '✦' },
      { type: 'video-bg', labelRu: 'Видео-фон', labelKz: 'Видео фон', icon: '▶' },
    ],
  },
];

interface Props {
  onAdd: (type: CanvasElementType) => void;
  /** For section insertion — pass doc + commit when in template-builder mode */
  document?: InvitationCanvasDocument;
  onInsertSection?: (nextDoc: InvitationCanvasDocument) => void;
  locale: 'ru' | 'kz';
}

export function ElementPalette({ onAdd, document, onInsertSection, locale }: Props) {
  const [open, setOpen] = useState<string>('sections');

  const handleInsertSection = (sectionId: string) => {
    if (!document || !onInsertSection) return;
    const lastBottom = document.elements.reduce(
      (max, el) => Math.max(max, el.y + (typeof el.h === 'number' ? el.h : 0)),
      0
    );
    const next = insertSection(document, sectionId, lastBottom);
    onInsertSection(next);
  };

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-800 bg-zinc-900/80 overflow-y-auto text-sm">
      <div className="p-3 text-xs uppercase tracking-widest text-zinc-400 border-b border-zinc-800">
        {locale === 'ru' ? 'Добавить элемент' : 'Элемент қосу'}
      </div>

      {/* ── Sections (open to end-users) ─────────────────────────── */}
      {document && onInsertSection && (
        <div className="border-b border-zinc-800">
          <button
            className="w-full px-3 py-2 flex items-center justify-between text-[#c9a961] hover:bg-zinc-800/60 font-semibold"
            onClick={() => setOpen(open === 'sections' ? '' : 'sections')}
          >
            <span>{locale === 'ru' ? '📦 Готовые секции' : '📦 Дайын бөлімдер'}</span>
            <span className="text-zinc-500">{open === 'sections' ? '▾' : '▸'}</span>
          </button>
          {open === 'sections' && (
            <div className="p-2 flex flex-col gap-2">
              {TEMPLATE_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleInsertSection(s.id)}
                  className="flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-800/40 hover:border-[#c9a961] hover:bg-zinc-800 px-3 py-2.5 text-left transition"
                >
                  <div className="shrink-0 w-8 h-8 rounded bg-[#6b1d3a]/20 flex items-center justify-center text-sm">
                    {SECTION_ICONS[s.id] ?? '▦'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-zinc-100 truncate">
                      {locale === 'ru' ? s.nameRu : s.nameKz}
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                      {locale === 'ru' ? s.descriptionRu : s.descriptionKz}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Element categories ────────────────────────────────────── */}
      {CATEGORIES.map((cat) => {
        const isOpen = open === cat.id;
        return (
          <div key={cat.id} className="border-b border-zinc-800">
            <button
              className="w-full px-3 py-2 flex items-center justify-between text-zinc-200 hover:bg-zinc-800/60"
              onClick={() => setOpen(isOpen ? '' : cat.id)}
            >
              <span>{locale === 'ru' ? cat.labelRu : cat.labelKz}</span>
              <span className="text-zinc-500">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="p-2 grid grid-cols-2 gap-2">
                {cat.items.map((it) => (
                  <button
                    key={it.type}
                    onClick={() => onAdd(it.type)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', it.type);
                    }}
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/40 hover:border-[#c9a961] hover:bg-zinc-800 px-2 py-3 text-[11px] text-zinc-200"
                    draggable
                  >
                    <span className="text-xl leading-none">{it.icon}</span>
                    <span className="text-center">{locale === 'ru' ? it.labelRu : it.labelKz}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
