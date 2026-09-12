import { describe, it, expect } from 'vitest';
import { isOpenRsvpEnabled, defaultCustomTextWithOpenRsvp } from '@/lib/guests/open-rsvp-config';

/*
 * 2026-09-12: open RSVP is the default for every event type.
 *
 * These tests used to assert the opposite — wedding, той and беташар defaulted
 * to personal links, and publishing stamped the flag into `customText`. That
 * combination meant the guess became permanent (no screen could change it) and
 * a free-published wedding could receive no answers at all, because the guest
 * list that issues personal links is behind payment. The host now decides, in
 * the hub, and the absence of the key means "default".
 */
describe('open-rsvp-config', () => {
  it('defaults to open for every event type, including wedding', () => {
    expect(isOpenRsvpEnabled({}, 'wedding')).toBe(true);
    expect(isOpenRsvpEnabled(undefined, 'toy')).toBe(true);
    expect(isOpenRsvpEnabled(null, 'betashar')).toBe(true);
    expect(isOpenRsvpEnabled({}, 'birthday')).toBe(true);
  });

  it("respects the host's explicit choice in both directions", () => {
    expect(isOpenRsvpEnabled({ openRsvp: false }, 'birthday')).toBe(false);
    expect(isOpenRsvpEnabled({ openRsvp: false }, 'wedding')).toBe(false);
    expect(isOpenRsvpEnabled({ openRsvp: true }, 'wedding')).toBe(true);
  });

  it('publishing does not stamp the flag', () => {
    expect(defaultCustomTextWithOpenRsvp({}, 'wedding')).toEqual({});
    expect(defaultCustomTextWithOpenRsvp({}, 'birthday')).toEqual({});
  });

  it('publishing preserves a choice the host already made', () => {
    expect(defaultCustomTextWithOpenRsvp({ openRsvp: false }, 'wedding')).toEqual({ openRsvp: false });
    expect(defaultCustomTextWithOpenRsvp({ greeting: 'x' }, 'wedding')).toEqual({ greeting: 'x' });
  });
});
