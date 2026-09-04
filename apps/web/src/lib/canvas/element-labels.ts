import type { CanvasElement, CanvasElementType } from '@/lib/canvas/types';

/**
 * The name of an element, for anywhere that has to list elements rather than
 * render them — the layers panel, the context menu, accessibility labels.
 *
 * Separate from the palette's wording on purpose: the palette is an add menu
 * and its strings describe an action's outcome ("Прямоугольник / круг / звезда"
 * offers three shapes behind one button), while a layers row needs the short
 * noun for the thing already on the canvas.
 */
const NAMES: Record<CanvasElementType, { ru: string; kz: string }> = {
  heading: { ru: 'Заголовок', kz: 'Тақырып' },
  text: { ru: 'Текст', kz: 'Мәтін' },
  'couple-names': { ru: 'Имена пары', kz: 'Жұп есімдері' },
  image: { ru: 'Фото', kz: 'Сурет' },
  shape: { ru: 'Фигура', kz: 'Пішін' },
  divider: { ru: 'Разделитель', kz: 'Бөлгіш' },
  ornament: { ru: 'Ою-өрнек', kz: 'Ою-өрнек' },
  button: { ru: 'Кнопка', kz: 'Батырма' },
  qr: { ru: 'QR-код', kz: 'QR-код' },
  gift: { ru: 'Подарок', kz: 'Сыйлық' },
  countdown: { ru: 'Таймер', kz: 'Кері санақ' },
  calendar: { ru: 'Календарь', kz: 'Күнтізбе' },
  'rsvp-form': { ru: 'Форма RSVP', kz: 'RSVP формасы' },
  wishes: { ru: 'Пожелания', kz: 'Тілектер' },
  program: { ru: 'Программа', kz: 'Бағдарлама' },
  map: { ru: 'Карта', kz: 'Карта' },
  music: { ru: 'Музыка', kz: 'Музыка' },
  lottie: { ru: 'Анимация', kz: 'Анимация' },
  'video-bg': { ru: 'Видео-фон', kz: 'Бейне фон' },
};

export function elementTypeName(type: CanvasElementType, locale: 'ru' | 'kz'): string {
  return NAMES[type]?.[locale] ?? type;
}

/**
 * What to show on a layers row: the element's own text when it has some, so a
 * list of nine headings is not nine rows reading "Заголовок".
 */
export function elementRowLabel(el: CanvasElement, locale: 'ru' | 'kz'): string {
  const own = (el as { text?: unknown }).text;
  if (typeof own === 'string') {
    const trimmed = own.replace(/\s+/g, ' ').trim();
    if (trimmed) return trimmed.length > 40 ? `${trimmed.slice(0, 39)}…` : trimmed;
  }
  return elementTypeName(el.type, locale);
}
