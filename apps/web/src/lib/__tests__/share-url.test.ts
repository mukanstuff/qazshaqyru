import { describe, it, expect } from 'vitest';
import { buildPublicInviteUrl, buildWhatsAppShareUrl, buildInviteShareMessage } from '@/lib/invitations/share-url';

describe('share-url', () => {
  it('builds public invite URL', () => {
    expect(buildPublicInviteUrl('https://example.com', 'abc-123')).toBe('https://example.com/i/abc-123');
  });

  it('builds WhatsApp share URL', () => {
    const url = buildWhatsAppShareUrl('Hello\nhttps://example.com/i/x');
    expect(url).toContain('wa.me');
    expect(url).toContain(encodeURIComponent('Hello'));
  });

  it('builds share message with title', () => {
    expect(buildInviteShareMessage('https://x/i/s', 'Той Айгүл')).toContain('Той Айгүл');
    expect(buildInviteShareMessage('https://x/i/s', 'Той Айгүл')).toContain('https://x/i/s');
  });
});
