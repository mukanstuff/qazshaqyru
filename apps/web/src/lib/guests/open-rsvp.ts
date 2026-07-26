import { normalizePhone, validatePhone } from '@/lib/auth';

export const OPEN_RSVP_MAX_NEW_GUESTS_PER_INVITATION = 200;

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
