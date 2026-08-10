/**
 * Applies QuickWizard form answers to a canvas document by binding matching
 * `placeholderKey` elements to form values.
 */
import type { InvitationCanvasDocument, CanvasElement } from './types';
import type { QuickWizardFormData } from '@/lib/shared/quick-wizard-schema';
import { splitCoupleNames } from '@/lib/shared/name-split';

export function applyWizardToCanvasDocument(
  doc: InvitationCanvasDocument,
  form: Partial<QuickWizardFormData>,
  locale: 'ru' | 'kz' = 'ru'
): InvitationCanvasDocument {
  const elements = doc.elements.map((el): CanvasElement => {
    if (!el.placeholderKey) return el;

    if (el.placeholderKey === 'groomName' || el.placeholderKey === 'brideName') {
      const parts = form.names ? splitCoupleNames(form.names) : [];
      const value = el.placeholderKey === 'groomName' ? parts[0] : parts[1];
      if (!value) return el;
      if (el.type === 'text' || el.type === 'heading') return { ...el, text: value };
    }

    if (el.placeholderKey === 'coupleNames' && form.names) {
      if (el.type === 'text' || el.type === 'heading') return { ...el, text: form.names };
      if (el.type === 'couple-names') {
        const parts = splitCoupleNames(form.names);
        return { ...el, first: parts[0] || '', second: parts[1] || '' };
      }
    }

    if (el.placeholderKey === 'eventDate') {
      if (!form.eventDate) return el;
      if (el.type === 'text' || el.type === 'heading') {
        const d = new Date(form.eventDate);
        const str = !Number.isNaN(d.getTime())
          ? d.toLocaleDateString(locale === 'kz' ? 'kk-KZ' : 'ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : form.eventDate;
        return { ...el, text: str };
      }
      if (el.type === 'countdown') {
        return { ...el, targetIso: form.eventDate };
      }
    }

    if (el.placeholderKey === 'venueName') {
      if (!form.eventPlace) return el;
      if (el.type === 'text' || el.type === 'heading') {
        return { ...el, text: form.eventPlace };
      }
    }

    if (el.placeholderKey === 'venueAddress') {
      if (!form.address) return el;
      if (el.type === 'text' || el.type === 'heading') {
        return { ...el, text: form.address };
      }
      if (el.type === 'map') {
        return { ...el, address: form.address };
      }
    }

    if (el.placeholderKey === 'coverPhoto') {
      if (!form.coverPhoto) return el;
      if (el.type === 'image') {
        return { ...el, src: form.coverPhoto };
      }
    }

    return el;
  });

  return { ...doc, elements };
}
