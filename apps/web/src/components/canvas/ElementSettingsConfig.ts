import type {
  CanvasElement,
  CanvasElementType,
  InvitationCanvasDocument,
} from '@/lib/canvas/types';

/**
 * 2026-08-17: Settings UI strategy for canvas elements.
 *
 * The pilot-2 chrome is a unified floating card. Every selected element
 * (text, image, RSVP, etc.) opens the same window — just with a different
 * field list per type. No more "compact vs expanded" split.
 */
export type SettingsField =
  | { kind: 'text'; key: string; label: string; placeholder?: string }
  | { kind: 'longtext'; key: string; label: string; placeholder?: string }
  | { kind: 'number'; key: string; label: string; min?: number; max?: number; step?: number }
  | { kind: 'range'; key: string; label: string; min: number; max: number; step?: number }
  | { kind: 'color'; key: string; label: string }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'checkbox'; key: string; label: string };

/**
 * Per-type title shown in the floating settings card header.
 */
export function settingsTitleFor(type: CanvasElementType): string {
  switch (type) {
    case 'text':
      return 'Текст';
    case 'heading':
      return 'Заголовок';
    case 'image':
      return 'Фото';
    case 'button':
      return 'Кнопка';
    case 'shape':
      return 'Фигура';
    case 'divider':
      return 'Разделитель';
    case 'couple-names':
      return 'Имена пары';
    case 'countdown':
      return 'Таймер';
    case 'rsvp-form':
      return 'RSVP';
    case 'wishes':
      return 'Пожелания';
    case 'program':
      return 'Программа';
    case 'map':
      return 'Карта';
    case 'music':
      return 'Музыка';
    case 'gift':
      return 'Подарки';
    case 'qr':
      return 'QR-код';
    case 'lottie':
      return 'Анимация';
    case 'video-bg':
      return 'Видео-фон';
    case 'ornament':
      return 'Орнамент';
    default:
      return type;
  }
}

export function settingsFieldsFor(type: CanvasElementType): SettingsField[] {
  switch (type) {
    case 'text':
    case 'heading':
      // Per user instruction: NO text input here — content is edited
      // via in-place click-to-edit on the canvas (single tap, not double).
      return [
        { kind: 'select', key: 'fontFamily', label: 'Шрифт', options: FONT_OPTIONS },
        { kind: 'number', key: 'fontSize', label: 'Размер', min: 6, max: 200 },
        { kind: 'select', key: 'fontWeight', label: 'Насыщенность', options: [
          { value: '300', label: '300' }, { value: '400', label: '400' },
          { value: '500', label: '500' }, { value: '600', label: '600' },
          { value: '700', label: '700' }, { value: '800', label: '800' },
        ] },
        { kind: 'color', key: 'color', label: 'Цвет' },
        { kind: 'select', key: 'textAlign', label: 'Выравнивание', options: [
          { value: 'left', label: '←' }, { value: 'center', label: '↔' }, { value: 'right', label: '→' },
        ] },
        { kind: 'number', key: 'lineHeight', label: 'Межстрочный', min: 0.5, max: 5, step: 0.1 },
        { kind: 'checkbox', key: 'italic', label: 'Курсив' },
        { kind: 'checkbox', key: 'uppercase', label: 'КАПС' },
      ];
    case 'image':
      return [
        { kind: 'range', key: 'borderRadius', label: 'Скругление', min: 0, max: 60 },
        { kind: 'text', key: 'alt', label: 'Alt-текст', placeholder: 'Описание для скринридеров' },
        { kind: 'text', key: 'linkHref', label: 'Ссылка', placeholder: 'https://…' },
      ];
    case 'button':
      return [
        { kind: 'text', key: 'label', label: 'Текст кнопки' },
        { kind: 'color', key: 'bgColor', label: 'Цвет фона' },
        { kind: 'color', key: 'textColor', label: 'Цвет текста' },
        { kind: 'select', key: 'fontFamily', label: 'Шрифт', options: FONT_OPTIONS },
        { kind: 'number', key: 'fontSize', label: 'Размер', min: 10, max: 48 },
        { kind: 'number', key: 'borderRadius', label: 'Скругление', min: 0, max: 60 },
      ];
    case 'shape':
      return [
        { kind: 'select', key: 'shape', label: 'Форма', options: [
          { value: 'rect', label: 'Прямоугольник' },
          { value: 'circle', label: 'Круг' },
          { value: 'line', label: 'Линия' },
          { value: 'star', label: 'Звезда' },
          { value: 'arrow', label: 'Стрелка' },
        ] },
        { kind: 'color', key: 'fill', label: 'Цвет заливки' },
        { kind: 'range', key: 'opacity', label: 'Прозрачность', min: 0, max: 1, step: 0.05 },
      ];
    case 'divider':
      return [
        { kind: 'color', key: 'color', label: 'Цвет' },
        { kind: 'number', key: 'thickness', label: 'Толщина', min: 1, max: 20 },
        { kind: 'select', key: 'style', label: 'Стиль', options: [
          { value: 'solid', label: 'Сплошной' },
          { value: 'dashed', label: 'Пунктир' },
          { value: 'dotted', label: 'Точки' },
          { value: 'ornament', label: 'Орнамент' },
        ] },
      ];
    case 'couple-names':
      return [
        { kind: 'text', key: 'first', label: 'Первый' },
        { kind: 'text', key: 'second', label: 'Второй' },
        { kind: 'select', key: 'connector', label: 'Разделитель', options: [
          { value: '&', label: '&' }, { value: 'heart', label: '♥' },
          { value: 'ornament', label: '❀' }, { value: 'және', label: 'және' }, { value: 'и', label: 'и' },
        ] },
        { kind: 'select', key: 'font', label: 'Шрифт', options: FONT_OPTIONS },
        { kind: 'number', key: 'fontSize', label: 'Размер', min: 12, max: 120 },
        { kind: 'color', key: 'color', label: 'Цвет' },
        { kind: 'color', key: 'connectorColor', label: 'Цвет разделителя' },
      ];
    case 'countdown':
      return [
        { kind: 'color', key: 'color', label: 'Цвет цифр' },
        { kind: 'color', key: 'accentColor', label: 'Акцент' },
        { kind: 'select', key: 'fontFamily', label: 'Шрифт', options: FONT_OPTIONS },
        { kind: 'number', key: 'fontSize', label: 'Размер', min: 12, max: 96 },
        { kind: 'checkbox', key: 'showLabels', label: 'Подписи' },
      ];
    case 'rsvp-form':
      return [
        { kind: 'text', key: 'title', label: 'Заголовок' },
        { kind: 'color', key: 'bgColor', label: 'Фон' },
        { kind: 'color', key: 'textColor', label: 'Цвет текста' },
        { kind: 'color', key: 'accentColor', label: 'Акцент' },
        { kind: 'checkbox', key: 'askPlusOne', label: '+1' },
        { kind: 'checkbox', key: 'askDietary', label: 'Диета' },
        { kind: 'checkbox', key: 'askChildren', label: 'Дети' },
      ];
    case 'wishes':
      return [
        { kind: 'text', key: 'title', label: 'Заголовок' },
        { kind: 'color', key: 'bgColor', label: 'Фон' },
        { kind: 'color', key: 'textColor', label: 'Цвет текста' },
        { kind: 'color', key: 'accentColor', label: 'Акцент' },
        { kind: 'checkbox', key: 'allowAnonymous', label: 'Анонимные' },
      ];
    case 'map':
      return [
        { kind: 'text', key: 'address', label: 'Адрес' },
        { kind: 'text', key: 'buttonLabel', label: 'Текст кнопки', placeholder: 'Открыть карту' },
        { kind: 'number', key: 'zoom', label: 'Масштаб', min: 1, max: 20 },
      ];
    case 'music':
      return [
        { kind: 'text', key: 'title', label: 'Название' },
        { kind: 'text', key: 'audioSrc', label: 'Источник аудио', placeholder: 'https://…' },
        { kind: 'color', key: 'accentColor', label: 'Акцент' },
        { kind: 'checkbox', key: 'autoPlayMuted', label: 'Автоплей' },
      ];
    case 'gift':
      return [
        { kind: 'text', key: 'title', label: 'Заголовок' },
        { kind: 'text', key: 'subtitle', label: 'Подпись' },
        { kind: 'text', key: 'kaspiPhone', label: 'Телефон Kaspi', placeholder: '+7 700 000 0000' },
        { kind: 'text', key: 'kaspiCard', label: 'Карта Kaspi', placeholder: '4400 4301 …' },
        { kind: 'checkbox', key: 'showDonors', label: 'Показывать дарителей' },
      ];
    case 'qr':
      return [
        { kind: 'text', key: 'value', label: 'Значение', placeholder: 'URL или текст' },
        { kind: 'text', key: 'caption', label: 'Подпись' },
        { kind: 'number', key: 'size', label: 'Размер', min: 40, max: 400 },
        { kind: 'color', key: 'fgColor', label: 'Цвет QR' },
        { kind: 'color', key: 'bgColor', label: 'Фон' },
      ];
    case 'lottie':
      return [
        { kind: 'text', key: 'src', label: 'URL JSON', placeholder: 'https://…lottie.json' },
        { kind: 'number', key: 'speed', label: 'Скорость', min: 0.1, max: 3, step: 0.1 },
        { kind: 'checkbox', key: 'loop', label: 'Зациклить' },
        { kind: 'checkbox', key: 'autoplay', label: 'Автоплей' },
      ];
    case 'video-bg':
      return [
        { kind: 'text', key: 'src', label: 'URL видео', placeholder: 'https://…mp4' },
        { kind: 'text', key: 'posterSrc', label: 'Постер', placeholder: 'https://…jpg' },
        { kind: 'color', key: 'overlayColor', label: 'Затемнение' },
        { kind: 'range', key: 'opacity', label: 'Прозрачность', min: 0, max: 1, step: 0.05 },
      ];
    case 'ornament':
      return [
        { kind: 'select', key: 'ornamentId', label: 'ID орнамента', options: [
          { value: 'oy-1', label: 'Ою-өрнек 1' },
          { value: 'oy-2', label: 'Ою-өрнек 2' },
          { value: 'oy-3', label: 'Ою-өрнек 3' },
          { value: 'oy-4', label: 'Ою-өрнек 4' },
        ] },
        { kind: 'color', key: 'color', label: 'Цвет' },
        { kind: 'text', key: 'src', label: 'Свой URL', placeholder: 'https://…svg' },
        { kind: 'checkbox', key: 'flipX', label: 'Отразить ↔' },
        { kind: 'checkbox', key: 'flipY', label: 'Отразить ↕' },
      ];
    default:
      return [];
  }
}

/**
 * 2026-08-17 (pilot-2): Bottom island categories.
 *
 * The island groups EXISTING canvas elements by type so users can
 * jump to "all text", "all photos", etc. on the canvas. Adding new
 * blocks is NOT part of the editor's scope here (that lives behind a
 * "make your own" mode, separate work).
 *
 * Sections that don't represent editable content (like date/time which
 * is implemented as a `text` element with a placeholder) are intentionally
 * NOT separate sections — they fall under `text`.
 */
export interface EditorSection {
  id: string;
  label: string;
  icon: string;
  /** Element types this section matches. */
  matches: CanvasElementType[];
}

export const EDITOR_SECTIONS: EditorSection[] = [
  { id: 'text', label: 'Текст', icon: 'T', matches: ['text', 'heading'] },
  { id: 'couple', label: 'Имена', icon: '♥', matches: ['couple-names'] },
  { id: 'photo', label: 'Фото', icon: '◰', matches: ['image'] },
  { id: 'countdown', label: 'Таймер', icon: '⏱', matches: ['countdown'] },
  { id: 'rsvp', label: 'RSVP', icon: '✉', matches: ['rsvp-form'] },
  { id: 'wishes', label: 'Пожелания', icon: '�', matches: ['wishes'] },
  { id: 'program', label: 'Программа', icon: '🕐', matches: ['program'] },
  { id: 'map', label: 'Место', icon: '◎', matches: ['map'] },
  { id: 'music', label: 'Музыка', icon: '♫', matches: ['music'] },
  { id: 'gift', label: 'Подарки', icon: '�', matches: ['gift'] },
  { id: 'other', label: 'Прочее', icon: '▦', matches: [
    'button', 'shape', 'divider', 'ornament', 'qr', 'lottie', 'video-bg',
  ] },
];

export interface SectionSummary {
  section: EditorSection;
  elements: CanvasElement[];
}

/**
 * Walks the document and groups elements by section. Only sections that
 * have at least one matching element appear in the result.
 */
export function sectionsFromDoc(doc: InvitationCanvasDocument): SectionSummary[] {
  const out: SectionSummary[] = [];
  for (const sec of EDITOR_SECTIONS) {
    const els = doc.elements.filter((e) => sec.matches.includes(e.type));
    if (els.length > 0) out.push({ section: sec, elements: els });
  }
  return out;
}

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Cormorant', label: 'Cormorant' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Cinzel', label: 'Cinzel' },
  { value: 'Great Vibes', label: 'Great Vibes' },
  { value: 'Dancing Script', label: 'Dancing Script' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Manrope', label: 'Manrope' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'system', label: 'System' },
];