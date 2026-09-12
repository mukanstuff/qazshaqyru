import { describe, it, expect } from 'vitest';
import { defaultOpenRsvpOnPublish } from '@/lib/invitations/invitation-publish';

/*
 * 2026-09-12: publishing no longer decides the RSVP mode.
 *
 * It used to stamp `openRsvp` into `customText` from the event type. Because
 * `isOpenRsvpEnabled` reads a stored value as the host's own decision, that
 * guess became permanent and nothing in the product could change it. Open is
 * now the default for every event type and the host toggles it in the hub, so
 * publishing must pass `customText` through untouched.
 */
describe('defaultOpenRsvpOnPublish', () => {
  it('does not add the flag for any event type', () => {
    expect(defaultOpenRsvpOnPublish({}, 'wedding')).toEqual({});
    expect(defaultOpenRsvpOnPublish({}, 'birthday')).toEqual({});
  });

  it("preserves the host's own choice", () => {
    expect(defaultOpenRsvpOnPublish({ openRsvp: false }, 'wedding')).toEqual({ openRsvp: false });
    expect(defaultOpenRsvpOnPublish({ openRsvp: true, greeting: 'Hi' }, 'wedding')).toEqual({
      openRsvp: true,
      greeting: 'Hi',
    });
  });

  it('leaves unrelated custom text alone', () => {
    expect(defaultOpenRsvpOnPublish({ greeting: 'Hi' }, 'wedding')).toEqual({ greeting: 'Hi' });
  });
});
