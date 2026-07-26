import { describe, it, expect } from 'vitest';
import { isEventPast, resolveEventDateTime } from '@/lib/shared/event-datetime';

describe('resolveEventDateTime', () => {
  it('uses event time on the event day in timezone', () => {
    const target = resolveEventDateTime('2026-12-31T00:00:00.000Z', '18:30', 'Asia/Almaty');
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Almaty',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(target);
    const hour = parts.find((p) => p.type === 'hour')?.value;
    const minute = parts.find((p) => p.type === 'minute')?.value;
    expect(hour).toBe('18');
    expect(minute).toBe('30');
  });
});

describe('isEventPast', () => {
  it('returns false for a future date', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isEventPast(future, null, 'Asia/Almaty')).toBe(false);
  });

  it('returns false for today without event time', () => {
    const today = new Date();
    expect(isEventPast(today, null, 'Asia/Almaty')).toBe(false);
  });

  it('returns true for a date clearly in the past', () => {
    const past = new Date('2020-01-01T12:00:00.000Z');
    expect(isEventPast(past, null, 'Asia/Almaty')).toBe(true);
  });
});
