import type { InvitationDocument } from '@/lib/invitations/document';

export type EditorFieldKind = 'text' | 'textarea' | 'date' | 'time' | 'url' | 'photo';

export type EditorSectionField = {
  /** Path for editor-store updateField */
  path: string;
  label: string;
  kind: EditorFieldKind;
  placeholder?: string;
};

/** Fields editable when a section is selected in the live editor. */
export function fieldsForSectionType(sectionType: string): EditorSectionField[] {
  switch (sectionType) {
    case 'hero-names':
      return [
        { path: 'customText.groomName', label: 'Жених / имя 1', kind: 'text' },
        { path: 'customText.brideName', label: 'Невеста / имя 2', kind: 'text' },
      ];
    case 'cover-photo':
      return [{ path: 'templateData.coverPhoto', label: 'Фото обложки', kind: 'photo' }];
    case 'calendar':
    case 'countdown':
      return [
        { path: 'eventDate', label: 'Дата', kind: 'date' },
        { path: 'eventTime', label: 'Время', kind: 'time' },
      ];
    case 'venue-map':
      return [
        { path: 'eventPlace', label: 'Название места', kind: 'text', placeholder: 'Ресторан…' },
        { path: 'address', label: 'Адрес', kind: 'text' },
        { path: 'mapUrl', label: 'Ссылка на карту', kind: 'url', placeholder: 'https://…' },
      ];
    case 'body-invitation':
      return [
        { path: 'customText.hostsLine', label: 'Строка хозяев', kind: 'text' },
        { path: 'customText.bodyTextRu', label: 'Текст (RU)', kind: 'textarea' },
        { path: 'customText.bodyTextKz', label: 'Текст (KZ)', kind: 'textarea' },
      ];
    case 'dress-code':
      return [
        { path: 'customText.dressCodeTitle', label: 'Заголовок', kind: 'text' },
        { path: 'customText.dressCodeNote', label: 'Описание', kind: 'textarea' },
      ];
    case 'gallery':
      return [
        { path: 'templateData.galleryPhoto1', label: 'Фото 1', kind: 'photo' },
        { path: 'templateData.galleryPhoto2', label: 'Фото 2', kind: 'photo' },
        { path: 'templateData.galleryPhoto3', label: 'Фото 3', kind: 'photo' },
        { path: 'templateData.galleryPhoto4', label: 'Фото 4', kind: 'photo' },
      ];
    case 'music':
      return [{ path: 'musicUrl', label: 'Ссылка на музыку', kind: 'url' }];
    case 'final-text':
      return [{ path: 'customText.finalText', label: 'Финальный текст', kind: 'textarea' }];
    case 'rsvp':
    case 'wishes':
    case 'envelope-intro':
      return [];
    default:
      return [];
  }
}

export function readFieldValue(document: InvitationDocument, path: string): string {
  if (path.startsWith('customText.')) {
    const key = path.slice('customText.'.length);
    return String(document.customText[key] ?? '');
  }
  if (path.startsWith('templateData.')) {
    const key = path.slice('templateData.'.length);
    return String(document.templateData[key] ?? '');
  }
  const meta = document.meta as unknown as Record<string, unknown>;
  const raw = meta[path];
  if (path === 'eventDate' && typeof raw === 'string' && raw.includes('T')) {
    return raw.slice(0, 10);
  }
  return raw == null ? '' : String(raw);
}
