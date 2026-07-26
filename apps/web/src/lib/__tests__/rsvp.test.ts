import { describe, it, expect } from 'vitest';
import { validateRsvpStatus } from '@/lib/guests/rsvp-status';

describe('RSVP status validation', () => {
  it('rejects plus_one when guest has no plus one slot', () => {
    expect(validateRsvpStatus('attending_plus_one', false)).toBe(false);
  });

  it('allows plus_one when guest has plus one slot', () => {
    expect(validateRsvpStatus('attending_plus_one', true)).toBe(true);
  });

  it('allows attending', () => {
    expect(validateRsvpStatus('attending', false)).toBe(true);
  });

  it('allows attending_no_children', () => {
    expect(validateRsvpStatus('attending_no_children', false)).toBe(true);
  });
});
