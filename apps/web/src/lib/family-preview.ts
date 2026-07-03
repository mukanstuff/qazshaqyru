import { buildFamilyPreviewUrl as buildPreviewUrl, createPreviewToken, verifyPreviewToken } from './preview-token';

export function generateFamilyPreviewToken(): { token: string; hash: string } {
  const { token, tokenHash } = createPreviewToken();
  return { token, hash: tokenHash };
}

export function verifyFamilyPreviewToken(
  storedHash: string | undefined | null,
  token: string | undefined | null
): boolean {
  return verifyPreviewToken(token ?? undefined, storedHash);
}

export function buildFamilyPreviewUrl(origin: string, slug: string, token: string): string {
  return buildPreviewUrl(origin, slug, token);
}

export function readFamilyPreviewHash(customText: unknown): string | undefined {
  if (!customText || typeof customText !== 'object') return undefined;
  const hash = (customText as Record<string, unknown>).familyPreviewTokenHash;
  return typeof hash === 'string' ? hash : undefined;
}
