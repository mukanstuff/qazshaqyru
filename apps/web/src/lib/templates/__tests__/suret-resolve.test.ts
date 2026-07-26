import { describe, expect, it } from 'vitest';
import {
  isSuretTemplateKey,
  readSuretSlots,
  resolveSuretSlug,
  withSuretSlots,
} from '@/lib/templates/suret-resolve';
import { normalizeTemplateSlug } from '@/lib/templates/template-resolve';
import { aiFillToFieldPatches } from '@/lib/ai/apply-ai-fill';

describe('suret resolve', () => {
  it('recognizes pilot by id and slug', () => {
    expect(isSuretTemplateKey('suret/uzatu-pilot-01')).toBe(true);
    expect(isSuretTemplateKey('suret-uzatu-pilot-01')).toBe(true);
    expect(isSuretTemplateKey('wedding-luxury')).toBe(false);
  });

  it('does not collapse suret to wedding-luxury', () => {
    expect(normalizeTemplateSlug('suret-uzatu-pilot-01')).toBe('suret-uzatu-pilot-01');
    expect(resolveSuretSlug('suret/uzatu-pilot-01')).toBe('suret-uzatu-pilot-01');
  });

  it('reads and writes suretSlots on templateData', () => {
    const data = withSuretSlots({ coverPhoto: 'x' }, { names: 'Ай / Нұр' });
    expect(data.renderEngine).toBe('suret');
    expect(readSuretSlots(data)).toEqual({ names: 'Ай / Нұр' });
    expect(readSuretSlots(null)).toEqual({});
  });
});

describe('ai fill patches', () => {
  it('maps hostsLine and rsvpIntro', () => {
    const patches = aiFillToFieldPatches({
      bodyRu: 'Текст',
      hostsLine: 'Семья хозяев',
      rsvpIntro: 'Подтвердите',
    });
    expect(patches.some((p) => p.path === 'customText.hostsLine' && p.value === 'Семья хозяев')).toBe(
      true,
    );
    expect(patches.some((p) => p.path === 'customText.rsvpIntro' && p.value === 'Подтвердите')).toBe(
      true,
    );
  });
});
