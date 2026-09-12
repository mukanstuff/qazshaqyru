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
  | { ok: true; normalized: string }
  | { ok: false; code: 'required' | 'invalid' };

export function validateOpenRsvpPhone(phone: string | undefined): OpenRsvpPhoneValidation {
  if (!phone?.trim()) {
    return { ok: false, code: 'required' };
  }
  const normalized = normalizePhone(phone);
  if (!validatePhone(normalized)) {
    return { ok: false, code: 'invalid' };
  }
  return { ok: true, normalized };
}
