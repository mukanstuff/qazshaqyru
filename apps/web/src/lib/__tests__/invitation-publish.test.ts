import { describe, it, expect } from 'vitest';
import { defaultOpenRsvpOnPublish } from '@/lib/invitations/invitation-publish';

describe('defaultOpenRsvpOnPublish', () => {
  it('disables open RSVP for wedding when not set', () => {
    expect(defaultOpenRsvpOnPublish({}, 'wedding')).toEqual({ openRsvp: false });
  });

  it('preserves explicit false', () => {
    expect(defaultOpenRsvpOnPublish({ openRsvp: false }, 'wedding')).toEqual({ openRsvp: false });
  });

  it('enables open RSVP for birthday by default', () => {
    expect(defaultOpenRsvpOnPublish({}, 'birthday')).toEqual({ openRsvp: true });
  });

  it('preserves explicit true', () => {
    expect(defaultOpenRsvpOnPublish({ openRsvp: true, greeting: 'Hi' }, 'wedding')).toEqual({
      openRsvp: true,
      greeting: 'Hi',
    });
  });
});
