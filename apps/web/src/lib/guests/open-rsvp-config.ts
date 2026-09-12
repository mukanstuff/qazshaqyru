import type { EventType } from '@prisma/client';

/**
 * Whether a guest arriving on the plain public link may answer.
 *
 * The two answer paths are not alternatives. A personal `?guest=` link always
 * wins in the form (see RsvpFormElementView), so leaving the common link open
 * costs a host with a guest list nothing and gives a host without one the only
 * way to collect answers at all.
 *
 * This used to default to `false` for wedding, той, беташар, қыз ұзату, сүндет
 * той and тұсаукесер, decided from the event type at the moment of publication
 * and written into `customText`. Three things were wrong with that:
 *  - no screen in the product could change the flag afterwards, so the guess
 *    was permanent;
 *  - changing the event type later did not change it, because the value was
 *    already stored;
 *  - the guest list that issues personal links is locked until payment, so a
 *    free-published wedding could receive no answers by any route whatsoever.
 *
 * Open is therefore the default for every event type, and closing it is an
 * explicit choice the host makes in the hub once they have a guest list.
 */
export function defaultOpenRsvpForEventType(_eventType?: EventType): boolean {
  return true;
}

/**
 * Open RSVP = one public link; guests enter name/phone to respond.
 * An explicit value in `customText` is the host's own decision and wins.
 */
export function isOpenRsvpEnabled(customText: unknown, eventType?: EventType): boolean {
  if (customText && typeof customText === 'object' && !Array.isArray(customText)) {
    const ct = customText as { openRsvp?: boolean };
    if (ct.openRsvp === true) return true;
    if (ct.openRsvp === false) return false;
  }
  return defaultOpenRsvpForEventType(eventType);
}

/**
 * Publishing no longer stamps the flag.
 *
 * Writing it at publish time is what froze the guess: `isOpenRsvpEnabled`
 * treats a stored value as the host's decision, and the host had never made
 * one. The absence of the key now means "default", which is what it should
 * always have meant.
 */
export function defaultCustomTextWithOpenRsvp(
  customText: unknown = {},
  _eventType?: EventType
): Record<string, unknown> {
  return customText && typeof customText === 'object' && !Array.isArray(customText)
    ? { ...(customText as Record<string, unknown>) }
    : {};
}
