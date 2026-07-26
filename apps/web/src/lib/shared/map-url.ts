const VALID_MAP_HOSTS = [
  '2gis.kz',
  'www.2gis.kz',
  'go.2gis.com',
  'www.google.com',
  'maps.google.com',
  'maps.google.kz',
  'maps.app.goo.gl',
  'yandex.kz',
  'maps.yandex.kz',
] as const;

export function isValidMapUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return VALID_MAP_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export function parseMapUrl(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;
  const trimmed = value.trim();
  if (!isValidMapUrl(trimmed)) {
    throw new Error('Разрешены только ссылки 2GIS, Google Maps или Yandex Maps');
  }
  return trimmed;
}

interface TwoGisPath {
  city: string;
  kind: 'firm' | 'geo';
  id: string;
}

function parse2GisPath(mapUrl: string): TwoGisPath | null {
  try {
    const url = new URL(mapUrl);
    if (!url.hostname.includes('2gis')) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const city = parts[0];
    const kind = parts[1];
    const id = parts[2];
    if (!city || !id || (kind !== 'firm' && kind !== 'geo')) return null;
    return { city, kind, id };
  } catch {
    return null;
  }
}

/** Build an embeddable 2GIS widget URL for firm/geo share links. */
export function build2GisEmbedUrl(mapUrl: string): string | null {
  const parsed = parse2GisPath(mapUrl);
  if (!parsed) return null;

  const options: Record<string, unknown> = {
    opt: { city: parsed.city },
    width: '100%',
    height: 360,
  };

  if (parsed.kind === 'firm') {
    options.org = { id: parsed.id };
    return `https://widgets.2gis.com/widget?type=firmsonmap&options=${encodeURIComponent(JSON.stringify(options))}`;
  }

  options.geoId = parsed.id;
  return `https://widgets.2gis.com/widget?type=online&options=${encodeURIComponent(JSON.stringify(options))}`;
}

export function canEmbedMap(mapUrl: string): boolean {
  return build2GisEmbedUrl(mapUrl) !== null;
}

export function is2GisUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname.includes('2gis');
  } catch {
    return false;
  }
}

/** Convert a 2GIS share URL into an embeddable iframe src when possible. */
export function to2GisEmbedUrl(value: string): string | null {
  if (!is2GisUrl(value)) return null;
  try {
    const url = new URL(value);
    if (url.pathname.includes('/tab/embed') || url.pathname.endsWith('/embed')) {
      return url.toString();
    }
    if (url.pathname.includes('/firm/')) {
      const path = url.pathname.replace(/\/$/, '');
      return `${url.origin}${path}/tab/embed`;
    }
    if (url.pathname.includes('/geo/')) {
      const path = url.pathname.replace(/\/$/, '');
      return `${url.origin}${path}/embed`;
    }
    return url.toString();
  } catch {
    return null;
  }
}
