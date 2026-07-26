import type { SectionType } from '@/lib/templates/manifest-types';

export function getSectionLabel(type: string, id: string, t: any): string {
  if (typeof t !== 'function') return id || type;
  
  // Mapping of internal section types to translation keys
  const typeToKey: Record<string, string> = {
    'envelope-intro': 'envelope',
    'hero-names': 'heroNames',
    'body-invitation': 'body',
    'cover-photo': 'photo',
    'venue-map': 'map',
    'final-text': 'final',
  };

  const key = `liveEditor.sections.${typeToKey[type] || type}`;
  const label = t(key);
  
  // If translation exists and is not just the key itself
  if (label && label !== key) return label;

  // Fallback map
  const fallbacks: Record<string, string> = {
    'envelope-intro': 'Конверт',
    'hero-names': 'Имена',
    'body-invitation': 'Текст',
    'cover-photo': 'Обложка',
    'venue-map': 'Карта',
    'calendar': 'Календарь',
    'countdown': 'Таймер',
    'rsvp': 'RSVP',
    'wishes': 'Пожелания',
    'music': 'Музыка',
    'dress-code': 'Дресс-код',
    'gallery': 'Галерея',
    'final-text': 'Финал',
    'kaspi': 'Kaspi',
    'program': 'Программа',
  };

  return fallbacks[type] || id || type;
}

/** EditorToolbar inside invitation stage — off for embed/live canvas. */
export function shouldRenderEditorToolbar(opts: {
  isEditing: boolean;
  previewEmbedFrame: boolean;
}): boolean {
  return opts.isEditing && !opts.previewEmbedFrame;
}
