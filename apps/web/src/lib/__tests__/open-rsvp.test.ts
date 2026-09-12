import { describe, it, expect } from 'vitest';
import { validateOpenRsvpPhone } from '@/lib/guests/open-rsvp';

describe('validateOpenRsvpPhone', () => {
  // The owner's rule: no invitation ever demands a phone number. A blank one
  // is accepted and the guest is deduped by name instead.
  it('accepts a missing phone', () => {
    const absent = validateOpenRsvpPhone(undefined);
    expect(absent.ok).toBe(true);
    if (absent.ok) expect(absent.normalized).toBeNull();
    const blank = validateOpenRsvpPhone('   ');
    expect(blank.ok).toBe(true);
    if (blank.ok) expect(blank.normalized).toBeNull();
  });

  it('accepts valid KZ phone', () => {
    const result = validateOpenRsvpPhone('87001234567');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalized).toBe('+77001234567');
    }
  });

  it('rejects invalid phone', () => {
    expect(validateOpenRsvpPhone('123').ok).toBe(false);
  });
});
