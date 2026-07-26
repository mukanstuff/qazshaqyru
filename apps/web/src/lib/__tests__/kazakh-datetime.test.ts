import { describe, it, expect } from 'vitest';
import {
  formatEventDateBanner,
  formatEventTimeBanner,
  getCalendarGrid,
  getWeekdayLabels,
} from '@/lib/shared/kazakh-datetime';

describe('kazakh-datetime', () => {
  const date = new Date(2026, 8, 9); // Sep 9 2026

  it('formats Kazakh date banner', () => {
    expect(formatEventDateBanner(date, 'kz')).toBe('09 ҚЫРКҮЙЕК 2026 ЖЫЛ');
  });

  it('formats Russian date banner', () => {
    expect(formatEventDateBanner(date, 'ru')).toBe('09 СЕНТЯБРЯ 2026 ГОДА');
  });

  it('formats event time banner', () => {
    expect(formatEventTimeBanner('19:00', 'kz')).toBe('САҒАТ 19:00');
    expect(formatEventTimeBanner('19:00', 'ru')).toBe('В 19:00');
  });

  it('builds calendar grid with Monday start', () => {
    const grid = getCalendarGrid(2026, 8);
    expect(grid[0][0]).toBeNull();
    expect(grid.flat().filter(Boolean)).toHaveLength(30);
    expect(grid.flat().includes(9)).toBe(true);
  });

  it('returns weekday labels', () => {
    expect(getWeekdayLabels('kz')[0]).toBe('ДС');
    expect(getWeekdayLabels('ru')[0]).toBe('ПН');
  });
});
