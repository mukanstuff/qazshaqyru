import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildFamilyPreviewUrl,
  generateFamilyPreviewToken,
  readFamilyPreviewHash,
  verifyFamilyPreviewToken,
} from '../family-preview';

describe('family-preview', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = 'test-session-secret-minimum-32-characters';
  });

  it('creates token/hash pair and verifies it', () => {
    const { token, hash } = generateFamilyPreviewToken();

    expect(token).toBeTruthy();
    expect(hash).toHaveLength(64);
    expect(verifyFamilyPreviewToken(hash, token)).toBe(true);
  });

  it('rejects invalid token combinations', () => {
    const { hash } = generateFamilyPreviewToken();

    expect(verifyFamilyPreviewToken(hash, 'wrong')).toBe(false);
    expect(verifyFamilyPreviewToken(null, 'token')).toBe(false);
    expect(verifyFamilyPreviewToken(hash, null)).toBe(false);
  });

  it('reads legacy hash field from customText', () => {
    const customText = {
      familyPreviewTokenHash: 'hash-1',
    };

    expect(readFamilyPreviewHash(customText)).toBe('hash-1');
    expect(buildFamilyPreviewUrl('https://invito.kz/', 'demo', 'token-1')).toBe(
      'https://invito.kz/i/demo?preview=token-1'
    );
  });
});
