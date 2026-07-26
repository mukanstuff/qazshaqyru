import { describe, it, expect } from 'vitest';
import { isValidRedirectPath, sanitizeRedirectPath } from '@/lib/shared/redirect';

describe('redirect path validation', () => {
  it('accepts internal paths', () => {
    expect(isValidRedirectPath('/dashboard')).toBe(true);
    expect(isValidRedirectPath('/invitations/abc')).toBe(true);
  });

  it('rejects external URLs', () => {
    expect(isValidRedirectPath('https://evil.com')).toBe(false);
    expect(isValidRedirectPath('//evil.com')).toBe(false);
  });

  it('sanitizes unsafe redirects', () => {
    expect(sanitizeRedirectPath('https://evil.com', '/dashboard')).toBe('/dashboard');
    expect(sanitizeRedirectPath('/invitations/1', '/dashboard')).toBe('/invitations/1');
  });
});
