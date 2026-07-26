import type { SectionType } from '@/lib/templates/manifest-types';

export function getSectionLabel(type: string, id: string, t: (key: string) => string): string {
  const key = `public.sections.${type === 'hero-names' ? 'heroNames' : type}` as any;
  // Try to find in i18n
  const label = t(key);
  if (label && label !== key) return label;

  // Fallback map if not in i18n yet
  const fallbacks: Record<string, string> = {
    'envelope-intro': 'Конверт',
    'hero-names': 'Имена',
    'body-invitation': 'Текст',
    'cover-photo': 'Обложка',
    'venue-map': 'Карта',
    'final-text': 'Финал',
  };

  return fallbacks[type] || id;
}

/** EditorToolbar inside invitation stage — off for embed/live canvas. */
export function shouldRenderEditorToolbar(opts: {
  isEditing: boolean;
  previewEmbedFrame: boolean;
}): boolean {
  return opts.isEditing && !opts.previewEmbedFrame;
}
