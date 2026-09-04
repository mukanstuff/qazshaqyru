/**
 * Applies QuickWizard form answers to a canvas document by binding matching
 * `placeholderKey` elements to form values.
 */
import type { InvitationCanvasDocument } from './types';
import type { QuickWizardFormData } from '@/lib/shared/quick-wizard-schema';
import { splitCoupleNames } from '@/lib/shared/name-split';
import { applyPlaceholderFields } from './apply-field-placeholders';

export function applyWizardToCanvasDocument(
  doc: InvitationCanvasDocument,
  form: Partial<QuickWizardFormData>,
  locale: 'ru' | 'kz' = 'ru'
): InvitationCanvasDocument {
  const parts = form.names ? splitCoupleNames(form.names) : [];
  return applyPlaceholderFields(
    doc,
    {
      groomName: parts[0] || undefined,
      brideName: parts[1] || undefined,
      coupleNamesFull: form.names,
      eventDateIso: form.eventDate,
      eventTime: form.eventTime || undefined,
      eventPlace: form.eventPlace || undefined,
      address: form.address || undefined,
      coverPhoto: form.coverPhoto || undefined,
    },
    locale
  );
}
