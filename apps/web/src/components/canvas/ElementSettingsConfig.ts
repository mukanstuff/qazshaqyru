import type {
  CanvasElement,
  CanvasElementType,
  InvitationCanvasDocument,
} from '@/lib/canvas/types';

type Locale = 'ru' | 'kz';

const SETTINGS_TITLES: Record<CanvasElementType, { ru: string; kz: string }> = {
  text: { ru: 'Текст', kz: 'Мәтін' },
  heading: { ru: 'Заголовок', kz: 'Тақырып' },
  image: { ru: 'Фото', kz: 'Сурет' },
  button: { ru: 'Кнопка', kz: 'Батырма' },
  shape: { ru: 'Фигура', kz: 'Пішін' },
  divider: { ru: 'Разделитель', kz: 'Бөлгіш' },
  'couple-names': { ru: 'Имена пары', kz: 'Жұп есімдері' },
  countdown: { ru: 'Таймер', kz: 'Кері санақ' },
  calendar: { ru: 'Календарь', kz: 'Күнтізбе' },
  'rsvp-form': { ru: 'RSVP', kz: 'RSVP' },
  wishes: { ru: 'Пожелания', kz: 'Тілектер' },
  program: { ru: 'Программа', kz: 'Бағдарлама' },
  map: { ru: 'Карта', kz: 'Карта' },
  music: { ru: 'Музыка', kz: 'Музыка' },
  gift: { ru: 'Подарки', kz: 'Сыйлықтар' },
  qr: { ru: 'QR-код', kz: 'QR-код' },
  lottie: { ru: 'Анимация', kz: 'Анимация' },
  'video-bg': { ru: 'Видео-фон', kz: 'Видео фон' },
  ornament: { ru: 'Орнамент', kz: 'Ою-өрнек' },
};

/**
 * Per-type title shown in the quick-edit "Texts" tab section header.
 */
export function settingsTitleFor(type: CanvasElementType, locale: Locale = 'ru'): string {
  return SETTINGS_TITLES[type]?.[locale] ?? type;
}

/**
 * "Sections" tab — groups EXISTING canvas elements by type so users can
 * jump to "all text", "all photos", etc. and toggle visibility. Adding new
 * blocks is not part of this tab's scope (that's `ElementPalette`).
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

const EDITOR_SECTION_DEFS: Array<{ id: string; ru: string; kz: string; icon: string; matches: CanvasElementType[] }> = [
  { id: 'text', ru: 'Текст', kz: 'Мәтін', icon: 'T', matches: ['text', 'heading'] },
  { id: 'couple', ru: 'Имена', kz: 'Есімдер', icon: '♥', matches: ['couple-names'] },
  { id: 'photo', ru: 'Фото', kz: 'Сурет', icon: '◰', matches: ['image'] },
  { id: 'countdown', ru: 'Таймер', kz: 'Кері санақ', icon: '⏱', matches: ['countdown'] },
  { id: 'rsvp', ru: 'RSVP', kz: 'RSVP', icon: '✉', matches: ['rsvp-form'] },
  { id: 'wishes', ru: 'Пожелания', kz: 'Тілектер', icon: '💌', matches: ['wishes'] },
  { id: 'program', ru: 'Программа', kz: 'Бағдарлама', icon: '🕐', matches: ['program'] },
  { id: 'map', ru: 'Место', kz: 'Орын', icon: '◎', matches: ['map'] },
  { id: 'music', ru: 'Музыка', kz: 'Музыка', icon: '♫', matches: ['music'] },
  { id: 'gift', ru: 'Подарки', kz: 'Сыйлықтар', icon: '🎁', matches: ['gift'] },
  { id: 'other', ru: 'Прочее', kz: 'Басқа', icon: '▦', matches: [
    'button', 'shape', 'divider', 'ornament', 'qr', 'lottie', 'video-bg',
  ] },
];

export function editorSectionsFor(locale: Locale = 'ru'): EditorSection[] {
  return EDITOR_SECTION_DEFS.map(({ id, ru, kz, icon, matches }) => ({
    id,
    label: locale === 'ru' ? ru : kz,
    icon,
    matches,
  }));
}

export interface SectionSummary {
  section: EditorSection;
  elements: CanvasElement[];
}

/**
 * Walks the document and groups elements by section. Only sections that
 * have at least one matching element appear in the result.
 */
export function sectionsFromDoc(doc: InvitationCanvasDocument, locale: Locale = 'ru'): SectionSummary[] {
  const out: SectionSummary[] = [];
  for (const sec of editorSectionsFor(locale)) {
    const els = doc.elements.filter((e) => sec.matches.includes(e.type));
    if (els.length > 0) out.push({ section: sec, elements: els });
  }
  return out;
}
