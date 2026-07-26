import type { SectionType } from '@/lib/templates/manifest-types';

const SECTION_LABELS_RU: Record<SectionType, string> = {
  'envelope-intro': 'Конверт',
  'hero-names': 'Имена',
  'body-invitation': 'Текст приглашения',
  'cover-photo': 'Обложка',
  calendar: 'Календарь',
  countdown: 'Обратный отсчёт',
  'venue-map': 'Место и карта',
  rsvp: 'Ответ гостей',
  wishes: 'Пожелания',
  music: 'Музыка',
  'dress-code': 'Дресс-код',
  gallery: 'Галерея',
  'final-text': 'Финал',
  kaspi: 'Kaspi подарки',
  program: 'Программа',
};

export function getSectionLabel(type: string, id: string): string {
  if (type in SECTION_LABELS_RU) {
    return SECTION_LABELS_RU[type as SectionType];
  }
  return id;
}

/** EditorToolbar inside invitation stage — off for embed/live canvas. */
export function shouldRenderEditorToolbar(opts: {
  isEditing: boolean;
  previewEmbedFrame: boolean;
}): boolean {
  return opts.isEditing && !opts.previewEmbedFrame;
}
