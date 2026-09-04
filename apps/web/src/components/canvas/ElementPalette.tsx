'use client';

import { useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Film,
  Gift,
  Hash,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  ListOrdered,
  MapPin,
  MessageSquare,
  Music,
  MousePointerClick,
  NotebookPen,
  Pilcrow,
  QrCode,
  SeparatorHorizontal,
  Shapes,
  Shirt,
  Sparkles,
  Timer,
  CalendarDays,
  Type,
  Video,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetCloseButton } from '@/components/ui/sheet';
import type { CanvasElementType } from '@/lib/canvas/types';
import { TEMPLATE_SECTIONS, insertSection } from '@/lib/canvas/sections';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';

const SECTION_ICONS: Record<string, LucideIcon> = {
  hero: Heart,
  datetime: Calendar,
  venue: MapPin,
  photo: ImageIcon,
  dresscode: Shirt,
  countdown: Timer,
  text: Pilcrow,
  hashtag: Hash,
  thankyou: Check,
};

interface PaletteItem {
  type: CanvasElementType;
  labelRu: string;
  labelKz: string;
  icon: LucideIcon;
}

interface Category {
  id: string;
  labelRu: string;
  labelKz: string;
  icon: LucideIcon;
  items: PaletteItem[];
}

const CATEGORIES: Category[] = [
  {
    id: 'text',
    labelRu: 'Текст',
    labelKz: 'Мәтін',
    icon: Type,
    items: [
      { type: 'heading', labelRu: 'Заголовок', labelKz: 'Тақырып', icon: Type },
      { type: 'text', labelRu: 'Абзац', labelKz: 'Абзац', icon: Pilcrow },
      { type: 'couple-names', labelRu: 'Имена пары', labelKz: 'Жұп есімдері', icon: Heart },
    ],
  },
  {
    id: 'photo',
    labelRu: 'Фото',
    labelKz: 'Фото',
    icon: ImageIcon,
    items: [{ type: 'image', labelRu: 'Фото', labelKz: 'Сурет', icon: ImageIcon }],
  },
  {
    id: 'shapes',
    labelRu: 'Фигуры',
    labelKz: 'Пішіндер',
    icon: Shapes,
    items: [
      { type: 'shape', labelRu: 'Прямоугольник / круг / звезда', labelKz: 'Төртбұрыш / шеңбер', icon: Shapes },
      { type: 'divider', labelRu: 'Разделитель', labelKz: 'Бөлгіш', icon: SeparatorHorizontal },
    ],
  },
  {
    id: 'decor',
    labelRu: 'Декор',
    labelKz: 'Декор',
    icon: Sparkles,
    items: [{ type: 'ornament', labelRu: 'Ою-өрнек', labelKz: 'Ою-өрнек', icon: Sparkles }],
  },
  {
    id: 'blocks',
    labelRu: 'Кнопки и блоки',
    labelKz: 'Батырмалар',
    icon: LayoutGrid,
    items: [
      { type: 'button', labelRu: 'Кнопка', labelKz: 'Батырма', icon: MousePointerClick },
      { type: 'qr', labelRu: 'QR-код', labelKz: 'QR', icon: QrCode },
      { type: 'gift', labelRu: 'Подарок (Каспи)', labelKz: 'Сыйлық (Каспи)', icon: Gift },
    ],
  },
  {
    id: 'interactive',
    labelRu: 'Интерактив',
    labelKz: 'Интерактив',
    icon: Zap,
    items: [
      { type: 'countdown', labelRu: 'Таймер', labelKz: 'Кері санақ', icon: Timer },
      { type: 'calendar', labelRu: 'Календарь', labelKz: 'Күнтізбе', icon: CalendarDays },
      { type: 'rsvp-form', labelRu: 'Форма RSVP', labelKz: 'RSVP формасы', icon: ListOrdered },
      { type: 'wishes', labelRu: 'Пожелания', labelKz: 'Тілектер', icon: MessageSquare },
      { type: 'program', labelRu: 'Программа', labelKz: 'Бағдарлама', icon: Clock },
      { type: 'map', labelRu: 'Карта', labelKz: 'Карта', icon: MapPin },
    ],
  },
  {
    id: 'media',
    labelRu: 'Медиа',
    labelKz: 'Медиа',
    icon: Film,
    items: [
      { type: 'music', labelRu: 'Музыка', labelKz: 'Музыка', icon: Music },
      { type: 'lottie', labelRu: 'Lottie-анимация', labelKz: 'Lottie', icon: Sparkles },
      { type: 'video-bg', labelRu: 'Видео-фон', labelKz: 'Видео фон', icon: Video },
    ],
  },
];

interface Props {
  onAdd: (type: CanvasElementType) => void;
  document?: InvitationCanvasDocument;
  onInsertSection?: (nextDoc: InvitationCanvasDocument) => void;
  onOpenQuickEdit: () => void;
  locale: 'ru' | 'kz';
}

/**
 * The editor's bottom dock — the single control surface for adding content,
 * at every screen width. A horizontally scrollable row of category chips
 * plus a trailing quick-edit button, in one floating rounded bar.
 *
 * There is deliberately no desktop variant. This used to branch on
 * `useIsDesktop()` and render a 240px left accordion rail instead, with the
 * quick-edit button floating separately in the bottom-right corner — two
 * different interaction models to maintain, two things to keep from
 * overlapping each other, and a layout that only ever got tested properly
 * in one of its two states. Wide screens now get the same dock with more
 * room around it.
 */
export function ElementPalette({ onAdd, document, onInsertSection, onOpenQuickEdit, locale }: Props) {
  const { t } = useI18n();
  const [openSheet, setOpenSheet] = useState<string | null>(null);

  const canInsertSections = Boolean(document && onInsertSection);

  const handleInsertSection = (sectionId: string) => {
    if (!document || !onInsertSection) return;
    const lastBottom = document.elements.reduce(
      (max, el) => Math.max(max, el.y + (typeof el.h === 'number' ? el.h : 0)),
      0
    );
    onInsertSection(insertSection(document, sectionId, lastBottom));
    setOpenSheet(null);
  };

  const handleAdd = (type: CanvasElementType) => {
    onAdd(type);
    setOpenSheet(null);
  };

  const activeCategory = CATEGORIES.find((c) => c.id === openSheet) ?? null;
  const sheetOpen = openSheet !== null;
  const sheetTitle =
    openSheet === 'sections'
      ? locale === 'ru'
        ? 'Готовые секции'
        : 'Дайын бөлімдер'
      : activeCategory
        ? locale === 'ru'
          ? activeCategory.labelRu
          : activeCategory.labelKz
        : '';

  return (
    <>
      <div className="editor-dock-wrap">
        <div
          className="editor-dock"
          role="toolbar"
          aria-label={locale === 'ru' ? 'Добавить элемент' : 'Элемент қосу'}
        >
          <div className="editor-dock__scroll">
            {canInsertSections && (
              <button
                type="button"
                className="cp-strip-chip is-gold"
                data-active={openSheet === 'sections' ? 'true' : undefined}
                onClick={() => setOpenSheet('sections')}
              >
                <LayoutTemplate size={18} aria-hidden="true" />
                <span>{locale === 'ru' ? 'Секции' : 'Бөлімдер'}</span>
              </button>
            )}
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="cp-strip-chip"
                data-active={openSheet === cat.id ? 'true' : undefined}
                onClick={() => setOpenSheet(cat.id)}
              >
                <cat.icon size={18} aria-hidden="true" />
                <span>{locale === 'ru' ? cat.labelRu : cat.labelKz}</span>
              </button>
            ))}
          </div>

          <span className="editor-dock__divider" aria-hidden="true" />

          <button
            type="button"
            className="editor-dock__action"
            onClick={onOpenQuickEdit}
            aria-label={t('invitation.edit.canvas.fab.open')}
            title={t('invitation.edit.canvas.fab.title')}
          >
            <NotebookPen size={18} aria-hidden="true" />
            <span>{t('invitation.edit.canvas.fab.title')}</span>
          </button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(next) => !next && setOpenSheet(null)}>
        <SheetContent
          side="bottom"
          // Centred with `mx-auto` against the base variant's `inset-x-0`
          // (left:0/right:0 fixed, width capped by max-w-md — the classic
          // over-constrained-box trick, resolved by the auto margins), not
          // with `left-1/2 -translate-x-1/2`. That combination put the
          // horizontal offset on the `transform` property, the same property
          // the enter/exit keyframes animate — a CSS animation sets the whole
          // property, not just the axis it changes, so for the animation's
          // duration the horizontal centering vanished (the sheet sat flush
          // left of centre) and only snapped back once the animation ended
          // (no `forwards` fill-mode). Margin-based centering shares nothing
          // with `transform`, so nothing is lost while it animates.
          className="max-h-[75dvh] sm:bottom-6 sm:mx-auto sm:w-full sm:max-w-md sm:rounded-2xl sm:border"
        >
          <SheetHeader>
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetCloseButton />
          </SheetHeader>
          <SheetBody>
            {openSheet === 'sections' && (
              <div className="cp-section-body--stack">
                {TEMPLATE_SECTIONS.map((s) => {
                  const Icon = SECTION_ICONS[s.id] ?? LayoutTemplate;
                  return (
                    <button key={s.id} onClick={() => handleInsertSection(s.id)} className="cp-section-card">
                      <div className="cp-section-icon">
                        <Icon size={16} aria-hidden="true" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="cp-section-name">{locale === 'ru' ? s.nameRu : s.nameKz}</div>
                        <div className="cp-section-desc">{locale === 'ru' ? s.descriptionRu : s.descriptionKz}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {activeCategory && (
              <div className="cp-element-grid">
                {activeCategory.items.map((it) => (
                  <button
                    key={it.type}
                    onClick={() => handleAdd(it.type)}
                    className="cp-element-card"
                  >
                    <span className="cp-element-icon">
                      <it.icon size={20} aria-hidden="true" />
                    </span>
                    <span className="cp-element-label">{locale === 'ru' ? it.labelRu : it.labelKz}</span>
                  </button>
                ))}
              </div>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}
