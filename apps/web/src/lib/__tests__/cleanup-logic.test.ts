import { describe, it, expect } from 'vitest';

describe('rate limit cleanup predicate', () => {
  function shouldDeleteRateLimitEntry(entry: {
    resetAt: Date;
    blocked: boolean;
    blockedUntil: Date | null;
  }, now: Date): boolean {
    if (entry.resetAt >= now) return false;
    if (entry.blocked && entry.blockedUntil && entry.blockedUntil > now) return false;
    return true;
  }

  it('keeps active blocks after window reset', () => {
    const now = new Date('2026-06-29T12:00:00Z');
    expect(
      shouldDeleteRateLimitEntry(
        {
          resetAt: new Date('2026-06-29T11:00:00Z'),
          blocked: true,
          blockedUntil: new Date('2026-06-29T13:00:00Z'),
        },
        now
      )
    ).toBe(false);
  });

  it('deletes expired non-blocked entries', () => {
    const now = new Date('2026-06-29T12:00:00Z');
    expect(
      shouldDeleteRateLimitEntry(
        {
          resetAt: new Date('2026-06-29T11:00:00Z'),
          blocked: false,
          blockedUntil: null,
        },
        now
      )
    ).toBe(true);
  });
});

describe('template background reset', () => {
  function withoutCustomBackground(templateData: Record<string, unknown>) {
    const next = { ...templateData };
    delete next.backgroundImage;
    return next;
  }

  it('removes backgroundImage when switching templates', () => {
    expect(
      withoutCustomBackground({
        backgroundImage: 'https://example.com/old.jpg',
        couplePhoto1: '/uploads/a.jpg',
      })
    ).toEqual({ couplePhoto1: '/uploads/a.jpg' });
  });
});
