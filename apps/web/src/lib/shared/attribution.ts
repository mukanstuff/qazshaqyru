/**
 * First-touch marketing attribution. Nothing in the app captured
 * `?utm_source=...` before this — there was no way to tell which channel
 * (WhatsApp share, Instagram bio link, a paid campaign) actually produced a
 * paying customer. Middleware writes this cookie once, on the visitor's
 * first UTM-tagged page view; checkout reads it back and stamps the order.
 *
 * First-touch, not last-touch: the cookie is never overwritten once set, so
 * a visitor who arrives from an ad and comes back later via a direct link
 * still credits the ad that actually brought them in.
 */

export const ATTRIBUTION_COOKIE = 'qs_attrib';
export const ATTRIBUTION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days

export interface AttributionData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

const UTM_PARAM_MAP: Record<keyof AttributionData, string> = {
  utmSource: 'utm_source',
  utmMedium: 'utm_medium',
  utmCampaign: 'utm_campaign',
  utmTerm: 'utm_term',
  utmContent: 'utm_content',
};

const MAX_FIELD_LENGTH = 200;

function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, MAX_FIELD_LENGTH);
  return trimmed || undefined;
}

/** Reads `utm_*` query params off a request URL. Returns null when none are present (no attribution to record). */
export function extractAttributionFromSearchParams(searchParams: URLSearchParams): AttributionData | null {
  const data: AttributionData = {};
  for (const [key, param] of Object.entries(UTM_PARAM_MAP) as [keyof AttributionData, string][]) {
    const value = clean(searchParams.get(param));
    if (value) data[key] = value;
  }
  return data.utmSource ? data : null;
}

export function serializeAttribution(data: AttributionData): string {
  return JSON.stringify(data);
}

export function parseAttributionCookie(raw: string | undefined | null): AttributionData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.utmSource === 'string') {
      return parsed as AttributionData;
    }
  } catch {
    /* malformed cookie — ignore */
  }
  return null;
}
