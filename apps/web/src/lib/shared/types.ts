/**
 * Shared TypeScript types and enums used across the application.
 * This avoids duplication between client and server code.
 */

export const EVENT_TYPES = [
  'wedding',
  'toy',
  'betashar',
  'kyz_uzatu',
  'sundet_toy',
  'tusau_keser',
  'birthday',
  'anniversary',
  'corporate',
  'other',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, { ru: string; kz: string }> = {
  wedding: { ru: 'Свадьба', kz: 'Үйлену той' },
  toy: { ru: 'Той', kz: 'Той' },
  betashar: { ru: 'Беташар', kz: 'Беташар' },
  kyz_uzatu: { ru: 'Кыз узату', kz: 'Қыз ұзату' },
  sundet_toy: { ru: 'Сундет той', kz: 'Сүндет той' },
  tusau_keser: { ru: 'Тұсаукесер', kz: 'Тұсаукесер' },
  birthday: { ru: 'День рождения', kz: 'Туған күн' },
  anniversary: { ru: 'Юбилей', kz: 'Юбилей' },
  corporate: { ru: 'Корпоратив', kz: 'Корпоратив' },
  other: { ru: 'Другое', kz: 'Басқа' },
};
