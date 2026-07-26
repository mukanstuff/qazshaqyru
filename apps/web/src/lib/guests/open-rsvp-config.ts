import type { EventType } from '@prisma/client';

/** Traditional KZ events usually use personal guest links, not open RSVP. */
const PERSONAL_LINK_DEFAULT_EVENTS = new Set<EventType>([
  'wedding',
  'toy',
  'betashar',
  'kyz_uzatu',
  'sundet_toy',
  'tusau_keser',
]);

export function defaultOpenRsvpForEventType(eventType: EventType): boolean {
  return !PERSONAL_LINK_DEFAULT_EVENTS.has(eventType);
}

/**
 * Open RSVP = one public link; guests enter name/phone to respond.
 * Wedding/toy/betashar/kyz default to personal links (openRsvp: false).
 */
export function isOpenRsvpEnabled(customText: unknown, eventType?: EventType): boolean {
  if (customText && typeof customText === 'object' && !Array.isArray(customText)) {
    const ct = customText as { openRsvp?: boolean };
    if (ct.openRsvp === true) return true;
    if (ct.openRsvp === false) return false;
  }
  if (eventType) return defaultOpenRsvpForEventType(eventType);
  return true;
}

export function defaultCustomTextWithOpenRsvp(
  customText: unknown = {},
  eventType?: EventType
): Record<string, unknown> {
  const current =
    customText && typeof customText === 'object' && !Array.isArray(customText)
      ? { ...(customText as Record<string, unknown>) }
      : {};

  if (typeof current.openRsvp === 'boolean') {
    return current;
  }

  const openRsvp = eventType ? defaultOpenRsvpForEventType(eventType) : true;
  return { ...current, openRsvp };
}
