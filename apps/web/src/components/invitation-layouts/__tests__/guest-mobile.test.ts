// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GUEST_ENVELOPE_KEY, hasSeenEnvelope, markEnvelopeSeen, shouldShowEnvelope } from '../guest-mobile';

describe('guest-mobile envelope storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('builds stable storage key per slug', () => {
    expect(GUEST_ENVELOPE_KEY('my-wedding')).toBe('qazshaqyru:envelope:my-wedding');
  });

  it('returns false before envelope is seen', () => {
    expect(hasSeenEnvelope('test-slug')).toBe(false);
  });

  it('marks envelope as seen in localStorage', () => {
    markEnvelopeSeen('test-slug');
    expect(window.localStorage.getItem('qazshaqyru:envelope:test-slug')).toBe('1');
    expect(hasSeenEnvelope('test-slug')).toBe(true);
  });

  it('treats unreadable storage as already seen', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(hasSeenEnvelope('blocked-slug')).toBe(true);
    vi.restoreAllMocks();
  });

  it('skips envelope on demo and after first visit', () => {
    expect(shouldShowEnvelope('demo', false)).toBe(false);
    expect(shouldShowEnvelope('my-wedding', false)).toBe(true);
    markEnvelopeSeen('my-wedding');
    expect(shouldShowEnvelope('my-wedding', false)).toBe(false);
  });
});
