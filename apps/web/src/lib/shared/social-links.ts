const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com', 'instagr.am']);
const TELEGRAM_HOSTS = new Set(['t.me', 'www.t.me', 'telegram.me', 'www.telegram.me']);

function parseHttpUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

export function normalizeInstagramUrl(value: string): string | null {
  const url = parseHttpUrl(value);
  if (!url) return null;
  if (!INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;
  return url.toString();
}

export function normalizeTelegramUrl(value: string): string | null {
  const url = parseHttpUrl(value);
  if (!url) return null;
  if (!TELEGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;
  return url.toString();
}

export function extractSocialLinks(customText: Record<string, unknown> | undefined): {
  instagramUrl?: string;
  telegramUrl?: string;
} {
  const instagramRaw = typeof customText?.instagramUrl === 'string' ? customText.instagramUrl : '';
  const telegramRaw = typeof customText?.telegramUrl === 'string' ? customText.telegramUrl : '';
  const instagramUrl = instagramRaw ? normalizeInstagramUrl(instagramRaw) ?? undefined : undefined;
  const telegramUrl = telegramRaw ? normalizeTelegramUrl(telegramRaw) ?? undefined : undefined;
  return { instagramUrl, telegramUrl };
}
