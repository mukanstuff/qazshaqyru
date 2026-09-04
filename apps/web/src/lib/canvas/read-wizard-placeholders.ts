/**
 * The inverse of `applyWizardToCanvasDocument`: read the wizard's fields back
 * out of a canvas document.
 *
 * The fast-fill form only ever wrote. It opened with blank required fields on
 * templates that already carried names, a date and a venue, so the first thing
 * a new customer saw was an empty form refusing to apply — and anyone wanting
 * to change one field had to retype the other two. Reading the document first
 * turns the same form into an edit form.
 *
 * Anything the template does not bind is simply absent, exactly as the writing
 * side skips fields with no matching element.
 */
import type { InvitationCanvasDocument, CanvasElement } from './types';
import type { QuickWizardFormData } from '@/lib/shared/quick-wizard-schema';

function textOf(el: CanvasElement | undefined): string {
  if (!el) return '';
  if (el.type === 'text' || el.type === 'heading') return el.text?.trim() ?? '';
  return '';
}

function byKey(doc: InvitationCanvasDocument, key: string): CanvasElement | undefined {
  return doc.elements.find((el) => el.placeholderKey === key);
}

/** `2027-05-15T00:00:00.000Z` / `2027-05-15` → `2027-05-15`; anything else → ''. */
function isoDateOnly(value: string | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function readWizardFormFromDocument(
  doc: InvitationCanvasDocument,
): QuickWizardFormData {
  // Names: prefer the structured couple-names element, since that is what the
  // writing side prefers too. Its two halves are joined the way the form's own
  // parser (splitCoupleNames) splits them back apart.
  const coupleEl = doc.elements.find((el) => el.type === 'couple-names');
  const names =
    coupleEl && coupleEl.type === 'couple-names'
      ? [coupleEl.first?.trim(), coupleEl.second?.trim()].filter(Boolean).join(' & ')
      : textOf(byKey(doc, 'coupleNames'));

  // The date is stored as rendered prose on the text element ("15 МАМЫР
  // 2027"), which cannot be parsed back reliably — the countdown and calendar
  // hold the real ISO value.
  const dated = doc.elements.find(
    (el) =>
      (el.type === 'countdown' || el.type === 'calendar') &&
      typeof el.targetIso === 'string',
  );
  const eventDate = isoDateOnly(
    dated && (dated.type === 'countdown' || dated.type === 'calendar')
      ? dated.targetIso
      : undefined,
  );

  const venueEl = byKey(doc, 'venueName');
  const addressEl = byKey(doc, 'venueAddress');
  const photoEl = doc.elements.find(
    (el) =>
      (el.placeholderKey === 'coverPhoto' || el.placeholderKey === 'couplePhoto') &&
      el.type === 'image',
  );

  return {
    eventType: 'wedding',
    names,
    // A default only when the design carries no date at all — an empty date
    // input is a dead end, two months out is a plausible starting point.
    eventDate:
      eventDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    eventTime: textOf(byKey(doc, 'eventTime')),
    eventPlace:
      textOf(venueEl) ||
      (venueEl?.type === 'map' ? venueEl.markerTitle?.trim() ?? '' : ''),
    address:
      textOf(addressEl) ||
      (addressEl?.type === 'map' ? addressEl.address?.trim() ?? '' : ''),
    coverPhoto: photoEl && photoEl.type === 'image' ? photoEl.src ?? '' : '',
    colorScheme: undefined,
  };
}
