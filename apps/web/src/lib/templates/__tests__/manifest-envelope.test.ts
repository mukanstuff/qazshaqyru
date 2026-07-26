import { describe, expect, it } from 'vitest';
import { getTemplateManifest } from '../manifests';
import { manifestHasEnvelopeIntro } from '../manifest-envelope';

describe('manifestHasEnvelopeIntro', () => {
  it('returns true for wedding-luxury manifest', () => {
    const manifest = getTemplateManifest('wedding-luxury');
    expect(manifest).not.toBeNull();
    expect(manifestHasEnvelopeIntro(manifest!)).toBe(true);
  });

  it('returns false when no envelope-intro section', () => {
    expect(
      manifestHasEnvelopeIntro({
        slug: 'test',
        renderEngine: 'react-sections',
        eventTypeProfile: 'wedding',
        theme: {
          accent: '#000',
          textLight: '#fff',
          textDark: '#000',
          fonts: { display: 'serif', body: 'sans' },
        },
        assets: {},
        fields: [],
        sections: [{ id: 'hero-names', type: 'hero-names' }],
      }),
    ).toBe(false);
  });
});
