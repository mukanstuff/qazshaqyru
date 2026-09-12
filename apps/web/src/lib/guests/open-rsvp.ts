import { normalizePhone, validatePhone } from '@/lib/auth';

/**
 * Ceiling on guests who register themselves through the public link.
 *
 * 200 was below the size of the celebrations this product is sold for: a той
 * in Almaty or Astana runs two to four hundred people, and with companions the
 * guest rows pass 200 well before the hall is full. Since open RSVP is now the
 * default for every event type, that ceiling would have silently stopped
 * accepting answers halfway through a real wedding. It exists to bound abuse,
 * not to size the event, and the per-IP rate limit is what actually stops a
 * flood.
 */
export const OPEN_RSVP_MAX_NEW_GUESTS_PER_INVITATION = 600;

export type OpenRsvpPhoneValidation =
  | { ok: true; normalized: string | null }
  | { ok: false; code: 'invalid' };

/**
 * The phone number is optional, on every invitation.
 *
 * It used to be mandatory here because this is how a self-registering guest is
 * identified and deduped. That is a convenience for the owner, not something
 * to demand from a guest before they are allowed to say they are coming, and
 * the product rule is that no invitation ever requires a phone number. A blank
 * one is accepted; a number that IS filled in still has to be a real one,
 * because a typo silently breaks the owner's reminders.
 */
export function validateOpenRsvpPhone(phone: string | undefined): OpenRsvpPhoneValidation {
  if (!phone?.trim()) {
    return { ok: true, normalized: null };
  }
  const normalized = normalizePhone(phone);
  if (!validatePhone(normalized)) {
    return { ok: false, code: 'invalid' };
  }
  return { ok: true, normalized };
}
