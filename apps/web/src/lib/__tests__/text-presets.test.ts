import { describe, it, expect } from 'vitest';
import { getTextPresets, eventTypeFromSlug } from '@/lib/templates/text-presets';

describe('text-presets', () => {
  it('returns wedding presets with ru/kz copy', () => {
    const presets = getTextPresets('wedding');
    expect(presets.length).toBeGreaterThan(0);
    expect(presets[0].greetingRu.toLowerCase()).toContain('приглашаем');
    expect(presets[0].greetingKz).toMatch(/[\u0400-\u04FF]/);
  });

  it('returns Kazakh uzatu presets', () => {
    const presets = getTextPresets('kyz_uzatu');
    expect(presets.length).toBeGreaterThan(0);
    expect(presets[0].labelKz).toBeTruthy();
  });

  it('resolves event type from template slug', () => {
    expect(eventTypeFromSlug('kyz-traditional')).toBe('kyz_uzatu');
    expect(eventTypeFromSlug('luxe-gold')).toBe('wedding');
    expect(eventTypeFromSlug('sundet-gold')).toBe('sundet_toy');
  });

  it('returns sundet toy presets', () => {
    const presets = getTextPresets('sundet_toy');
    expect(presets.length).toBeGreaterThan(0);
    expect(presets[0].labelRu).toContain('Сундет');
  });
});
