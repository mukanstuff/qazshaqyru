import { describe, it, expect } from 'vitest';
import { aiFillToFieldPatches } from '@/lib/ai/apply-ai-fill';

describe('aiFillToFieldPatches', () => {
  it('maps body and greeting to live-editor paths', () => {
    const patches = aiFillToFieldPatches({
      bodyRu: 'RU body',
      bodyKz: 'KZ body',
      greeting: 'Dear guests',
      dressCode: 'Elegant',
    });
    expect(patches).toEqual(
      expect.arrayContaining([
        { path: 'customText.bodyTextRu', value: 'RU body' },
        { path: 'customText.bodyTextKz', value: 'KZ body' },
        { path: 'customText.greeting', value: 'Dear guests' },
        { path: 'customText.hostsLine', value: 'Dear guests' },
        { path: 'customText.dressCodeNote', value: 'Elegant' },
      ]),
    );
  });
});
