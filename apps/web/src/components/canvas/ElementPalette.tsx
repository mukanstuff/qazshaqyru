'use client';

import { useState } from 'react';
import type { CanvasElementType } from '@/lib/canvas/types';
import { TEMPLATE_SECTIONS, insertSection } from '@/lib/canvas/sections';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

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
    <aside className="canvas-palette" style={{ width: '240px', flexShrink: 0 }}>
      <div className="cp-header">
        {locale === 'ru' ? 'Добавить элемент' : 'Элемент қосу'}
      </div>

      {/* ── Sections (open to end-users) ─────────────────────────── */}
      {document && onInsertSection && (
        <div className="border-b" style={{ borderColor: 'var(--ed-border)' }}>
          <button
            className="cp-section-header is-gold"
            onClick={() => setOpen(open === 'sections' ? '' : 'sections')}
          >
            <span>{locale === 'ru' ? '📦 Готовые секции' : '📦 Дайын бөлімдер'}</span>
            <span className="cp-chevron">{open === 'sections' ? '▾' : '▸'}</span>
          </button>
          {open === 'sections' && (
            <div className="cp-section-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {TEMPLATE_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleInsertSection(s.id)}
                  className="cp-section-card"
                >
                  <div className="cp-section-icon">
                    {SECTION_ICONS[s.id] ?? '▦'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="cp-section-name">
                      {locale === 'ru' ? s.nameRu : s.nameKz}
                    </div>
                    <div className="cp-section-desc">
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
          <div key={cat.id} className="border-b" style={{ borderColor: 'var(--ed-border)' }}>
            <button
              className="cp-section-header"
              onClick={() => setOpen(isOpen ? '' : cat.id)}
            >
              <span>{locale === 'ru' ? cat.labelRu : cat.labelKz}</span>
              <span className="cp-chevron">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="cp-section-body">
                <div className="cp-element-grid">
                  {cat.items.map((it) => (
                    <button
                      key={it.type}
                      onClick={() => onAdd(it.type)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', it.type);
                      }}
                      className="cp-element-card"
                      draggable
                    >
                      <span className="cp-element-icon">{it.icon}</span>
                      <span className="cp-element-label">{locale === 'ru' ? it.labelRu : it.labelKz}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
