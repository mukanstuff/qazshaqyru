/**
 * Tap-to-edit helpers: map preview section keys → inspector / field focus.
 * Section click opens sheet; field-level EditableField edits inline when present.
 */

export const SECTION_PRIMARY_FIELD: Record<string, string> = {
  'hero-names': 'customText.groomName',
  'cover-photo': 'templateData.coverPhoto',
  'body-invitation': 'customText.invitationText',
  calendar: 'eventDate',
  'venue-map': 'eventPlace',
  countdown: 'eventDate',
  music: 'templateData.musicUrl',
  rsvp: 'customText.rsvpNote',
  wishes: 'customText.wishesTitle',
  'dress-code': 'customText.dressCode',
  program: 'customText.programTitle',
  kaspi: 'customText.kaspiDetails',
  'final-text': 'customText.finalText',
};

export function primaryFieldForSection(sectionKey: string): string | null {
  return SECTION_PRIMARY_FIELD[sectionKey] ?? null;
}

export function resolveTapEditTarget(target: EventTarget | null): {
  sectionKey: string | null;
  fieldKey: string | null;
} {
  if (!(target instanceof HTMLElement)) {
    return { sectionKey: null, fieldKey: null };
  }
  if (
    target.closest(
      'input, textarea, button, a, select, label, [contenteditable="true"], [role="textbox"]',
    )
  ) {
    const fieldEl = target.closest('[data-edit-field]') as HTMLElement | null;
    return {
      sectionKey: fieldEl?.closest('[data-section]')?.getAttribute('data-section') ?? null,
      fieldKey: fieldEl?.getAttribute('data-edit-field') ?? null,
    };
  }
  const fieldEl = target.closest('[data-edit-field]') as HTMLElement | null;
  const sectionEl = target.closest('[data-section]') as HTMLElement | null;
  return {
    sectionKey: sectionEl?.getAttribute('data-section') ?? null,
    fieldKey: fieldEl?.getAttribute('data-edit-field') ?? null,
  };
}
