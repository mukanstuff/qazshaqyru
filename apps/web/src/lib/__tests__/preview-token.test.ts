import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildFamilyPreviewUrl,
  createPreviewToken,
  issuePreviewToken,
  verifyPreviewToken,
} from '../preview-token';

describe('preview-token', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = 'test-session-secret-minimum-32-characters';
  });

  it('creates token and matching hash', () => {
    const { token, tokenHash } = createPreviewToken();

    expect(token).toBeTruthy();
    expect(tokenHash).toBeTruthy();
    expect(verifyPreviewToken(token, tokenHash)).toBe(true);
  });

  it('rejects mismatched token', () => {
    const { tokenHash } = createPreviewToken();

    expect(verifyPreviewToken('wrong-token', tokenHash)).toBe(false);
    expect(verifyPreviewToken('', tokenHash)).toBe(false);
    expect(verifyPreviewToken('token', null)).toBe(false);
  });

  it('builds preview URL with encoded values', () => {
    expect(buildFamilyPreviewUrl('https://invito.kz/', 'той 2026', 'abc+123')).toBe(
      'https://invito.kz/i/%D1%82%D0%BE%D0%B9%202026?preview=abc%2B123'
    );
  });

  it('reissues stable token from stored hash', () => {
    const { tokenHash } = createPreviewToken();
    const token = issuePreviewToken(tokenHash);

    expect(issuePreviewToken(tokenHash)).toBe(token);
    expect(verifyPreviewToken(token, tokenHash)).toBe(true);
  });
});
