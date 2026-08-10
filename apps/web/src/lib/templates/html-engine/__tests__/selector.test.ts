import { describe, expect, it } from 'vitest';
import { resolveGuestRenderPath } from '@/lib/templates/html-engine/selector';
import type { HtmlTemplateDescriptor } from '@/lib/templates/html-engine/types';

const descriptors: HtmlTemplateDescriptor[] = [
  {
    slug: 'luxe-gold',
    name: 'Luxe Gold',
    htmlPath: '/templates-html/luxe-gold/index.html',
    assetsDir: '/templates-html/luxe-gold/assets',
    accent: '#c8a96a',
    eventTypes: ['wedding'],
    fields: [
      { key: 'groomName', default: 'A' },
      { key: 'brideName', default: 'B' },
    ],
  },
];

describe('resolveGuestRenderPath', () => {
  it('returns html path when slug is in html list', () => {
    const result = resolveGuestRenderPath('luxe-gold', {
      htmlSlugs: ['luxe-gold'],
      descriptors,
    });
    expect(result.kind).toBe('html');
    if (result.kind === 'html') {
      expect(result.descriptor.slug).toBe('luxe-gold');
    }
  });

  it('returns react path when slug is not in html list', () => {
    const result = resolveGuestRenderPath('some-react-template', {
      htmlSlugs: ['luxe-gold'],
      descriptors,
    });
    expect(result.kind).toBe('react');
  });

  it('returns react path when slug is in list but descriptor missing', () => {
    const result = resolveGuestRenderPath('ghost-template', {
      htmlSlugs: ['ghost-template'],
      descriptors: [],
    });
    expect(result.kind).toBe('react');
    if (result.kind === 'react') {
      expect(result.reason).toBe('no-html-descriptor');
    }
  });
});