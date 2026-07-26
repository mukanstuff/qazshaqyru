import { describe, it, expect } from 'vitest';
import { validateOpenRsvpPhone } from '@/lib/guests/open-rsvp';

describe('validateOpenRsvpPhone', () => {
  it('requires phone', () => {
    expect(validateOpenRsvpPhone(undefined).ok).toBe(false);
    expect(validateOpenRsvpPhone('').ok).toBe(false);
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
