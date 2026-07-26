import { describe, it, expect } from 'vitest';
import { is2GisUrl, to2GisEmbedUrl } from '@/lib/shared/map-url';

describe('to2GisEmbedUrl', () => {
  it('detects 2gis hosts', () => {
    expect(is2GisUrl('https://2gis.kz/almaty/geo/70000001000000000')).toBe(true);
    expect(is2GisUrl('https://maps.google.com/place')).toBe(false);
  });

  it('appends embed path for geo links', () => {
    expect(to2GisEmbedUrl('https://2gis.kz/almaty/geo/70000001000000000')).toBe(
      'https://2gis.kz/almaty/geo/70000001000000000/embed',
    );
  });

  it('appends tab/embed for firm links', () => {
    expect(to2GisEmbedUrl('https://2gis.kz/almaty/firm/12345')).toBe(
      'https://2gis.kz/almaty/firm/12345/tab/embed',
    );
  });
});
