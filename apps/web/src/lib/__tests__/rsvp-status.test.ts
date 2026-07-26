import { describe, it, expect } from 'vitest';
import { validateRsvpStatus, isAttendingStatus, isRsvpStatus } from '@/lib/guests/rsvp-status';

describe('rsvp-status', () => {
  it('rejects plus_one when guest has no plus one slot', () => {
    expect(validateRsvpStatus('attending_plus_one', false)).toBe(false);
  });

  it('allows plus_one when guest has plus one slot', () => {
    expect(validateRsvpStatus('attending_plus_one', true)).toBe(true);
  });

  it('allows attending_no_children without plus one', () => {
    expect(validateRsvpStatus('attending_no_children', false)).toBe(true);
  });

  it('rejects unknown status', () => {
    expect(validateRsvpStatus('maybe', false)).toBe(false);
  });

  it('isRsvpStatus recognizes all valid values', () => {
    expect(isRsvpStatus('attending')).toBe(true);
    expect(isRsvpStatus('attending_no_children')).toBe(true);
    expect(isRsvpStatus('pending')).toBe(false);
  });

  it('isAttendingStatus includes no-children', () => {
    expect(isAttendingStatus('attending_no_children')).toBe(true);
    expect(isAttendingStatus('not_attending')).toBe(false);
  });
});
