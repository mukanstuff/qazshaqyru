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

  it('resolves event type from template slug prefix', () => {
    expect(eventTypeFromSlug('kyz-traditional')).toBe('kyz_uzatu');
    expect(eventTypeFromSlug('sundet-gold')).toBe('sundet_toy');
    // Was: expect(eventTypeFromSlug('luxe-gold')).toBe('wedding') — the
    // function has no rule that maps `luxe-gold` to anything, so it returned
    // 'other' and this assertion had simply been failing. The slug also has no
    // row in the Template table.
    expect(eventTypeFromSlug('wedding-classic')).toBe('wedding');
  });

  it('falls back to "other" for a slug it cannot classify', () => {
    // The live catalog: none of these slugs encode their event type, which is
    // why Template.category exists. This function is a prefix guess, not a
    // source of truth — see the note on top of eventTypeFromSlug.
    expect(eventTypeFromSlug('aq-bata')).toBe('other');
    expect(eventTypeFromSlug('dala')).toBe('other');
  });

  it('returns sundet toy presets', () => {
    const presets = getTextPresets('sundet_toy');
    expect(presets.length).toBeGreaterThan(0);
    expect(presets[0].labelRu).toContain('Сундет');
  });
});
