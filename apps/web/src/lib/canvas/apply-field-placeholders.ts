/**
 * Binds a flat set of invitation fields onto whichever canvas elements the
 * template author tagged with a matching `placeholderKey`. Shared by the
 * QuickWizard (via `applyWizardToCanvasDocument`) and the hub's Dates/Texts
 * sheets — both need "user typed a value, put it on the canvas", just from
 * different-shaped forms.
 *
 * A field with no matching element in the document is silently skipped
 * (not every template binds every key) — never invented or forced in.
 */
import type { InvitationCanvasDocument, CanvasElement } from './types';
import { formatEventDateLine } from '@/lib/shared/kazakh-datetime';

export interface PlaceholderFields {
  groomName?: string;
  brideName?: string;
  /** Combined "Groom & Bride" string for a single coupleNames-bound element. */
  coupleNamesFull?: string;
  /** ISO timestamp. */
  eventDateIso?: string;
  eventTime?: string;
  eventPlace?: string;
  address?: string;
  dressCode?: string;
  greetingText?: string;
  coverPhoto?: string;
}

export function applyPlaceholderFields(
  doc: InvitationCanvasDocument,
  fields: PlaceholderFields,
  locale: 'ru' | 'kz' = 'ru'
): InvitationCanvasDocument {
  const elements = doc.elements.map((el): CanvasElement => {
    if (!el.placeholderKey) return el;

    if (el.placeholderKey === 'groomName' && fields.groomName) {
      if (el.type === 'text' || el.type === 'heading') return { ...el, text: fields.groomName };
    }

    if (el.placeholderKey === 'brideName' && fields.brideName) {
      if (el.type === 'text' || el.type === 'heading') return { ...el, text: fields.brideName };
    }

    if (el.placeholderKey === 'coupleNames') {
      if (el.type === 'couple-names' && (fields.groomName || fields.brideName)) {
        return {
          ...el,
          first: fields.groomName ?? el.first,
          second: fields.brideName ?? el.second,
        };
      }
      if ((el.type === 'text' || el.type === 'heading') && fields.coupleNamesFull) {
        return { ...el, text: fields.coupleNamesFull };
      }
    }

    if (el.placeholderKey === 'eventDate' && fields.eventDateIso) {
      if (el.type === 'text' || el.type === 'heading') {
        const d = new Date(fields.eventDateIso);
        const str = !Number.isNaN(d.getTime()) ? formatEventDateLine(d, locale) : fields.eventDateIso;
        return { ...el, text: str };
      }
      if (el.type === 'countdown') {
        return { ...el, targetIso: fields.eventDateIso };
      }
      // The calendar block was missing here, so a template that draws a month
      // with the event day circled (dala does) kept the template author's
      // date forever: the host set 15 May, the text line and the countdown
      // updated, and every guest still saw the wrong month with the wrong day
      // marked.
      if (el.type === 'calendar') {
        return { ...el, targetIso: fields.eventDateIso };
      }
    }

    if (el.placeholderKey === 'eventTime' && fields.eventTime) {
      if (el.type === 'text' || el.type === 'heading') return { ...el, text: fields.eventTime };
    }

    if (el.placeholderKey === 'venueName' && fields.eventPlace) {
      if (el.type === 'text' || el.type === 'heading') return { ...el, text: fields.eventPlace };
      if (el.type === 'map') return { ...el, markerTitle: fields.eventPlace };
    }

    if (el.placeholderKey === 'venueAddress' && fields.address) {
      if (el.type === 'text' || el.type === 'heading') return { ...el, text: fields.address };
      if (el.type === 'map') return { ...el, address: fields.address };
    }

    if (el.placeholderKey === 'dressCode' && fields.dressCode) {
      if (el.type === 'text' || el.type === 'heading') return { ...el, text: fields.dressCode };
    }

    if (el.placeholderKey === 'greetingText' && fields.greetingText) {
      if (el.type === 'text' || el.type === 'heading') return { ...el, text: fields.greetingText };
    }

    // 'couplePhoto' and 'coverPhoto' are two template-authored names for the
    // same idea — the one photo a single upload field collects.
    if (
      (el.placeholderKey === 'coverPhoto' || el.placeholderKey === 'couplePhoto') &&
      fields.coverPhoto
    ) {
      if (el.type === 'image') return { ...el, src: fields.coverPhoto };
    }

    return el;
  });

  return { ...doc, elements };
}
