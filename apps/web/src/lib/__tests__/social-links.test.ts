import { describe, it, expect } from 'vitest';
import { normalizeInstagramUrl, normalizeTelegramUrl, extractSocialLinks } from '@/lib/shared/social-links';

describe('social-links', () => {
  it('accepts instagram URLs', () => {
    expect(normalizeInstagramUrl('https://instagram.com/couple')).toBe(
      'https://instagram.com/couple'
    );
  });

  it('rejects non-instagram hosts', () => {
    expect(normalizeInstagramUrl('https://evil.com/user')).toBeNull();
  });

  it('accepts telegram URLs', () => {
    expect(normalizeTelegramUrl('https://t.me/channel')).toBe('https://t.me/channel');
  });

  it('extracts social links from customText', () => {
    const links = extractSocialLinks({
      instagramUrl: 'instagram.com/test',
      telegramUrl: 't.me/test',
    });
    expect(links.instagramUrl).toContain('instagram.com');
    expect(links.telegramUrl).toContain('t.me');
  });
});
