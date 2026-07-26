import { describe, it, expect } from 'vitest';
import { isOpenRsvpEnabled, defaultCustomTextWithOpenRsvp } from '@/lib/guests/open-rsvp-config';

describe('open-rsvp-config', () => {
  it('defaults wedding to personal links (open RSVP off)', () => {
    expect(isOpenRsvpEnabled({}, 'wedding')).toBe(false);
    expect(isOpenRsvpEnabled(undefined, 'toy')).toBe(false);
    expect(isOpenRsvpEnabled(null, 'betashar')).toBe(false);
  });

  it('defaults birthday to open RSVP', () => {
    expect(isOpenRsvpEnabled({}, 'birthday')).toBe(true);
  });

  it('respects explicit false', () => {
    expect(isOpenRsvpEnabled({ openRsvp: false }, 'birthday')).toBe(false);
  });

  it('respects explicit true on wedding', () => {
    expect(isOpenRsvpEnabled({ openRsvp: true }, 'wedding')).toBe(true);
  });

  it('defaultCustomTextWithOpenRsvp sets openRsvp by event type', () => {
    expect(defaultCustomTextWithOpenRsvp({}, 'wedding')).toEqual({ openRsvp: false });
    expect(defaultCustomTextWithOpenRsvp({}, 'birthday')).toEqual({ openRsvp: true });
    expect(defaultCustomTextWithOpenRsvp({ openRsvp: false }, 'wedding')).toEqual({ openRsvp: false });
  });
});
