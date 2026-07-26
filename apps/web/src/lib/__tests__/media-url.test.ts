import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CURATED_MUSIC_URLS,
  isAllowedUserMediaUrl,
  isAllowedTemplateMediaUrl,
  parseUserMediaUrl,
  parseTemplateMediaUrl,
} from '@/lib/uploads/media-url';

describe('media-url', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
  it('allows local upload paths', () => {
    expect(isAllowedUserMediaUrl('/uploads/invitations/abc.jpg')).toBe(true);
    expect(parseUserMediaUrl('/uploads/music/track.mp3')).toBe('/uploads/music/track.mp3');
  });

  it('allows curated Pixabay music tracks', () => {
    const url = [...CURATED_MUSIC_URLS][0];
    expect(isAllowedUserMediaUrl(url)).toBe(true);
    expect(parseUserMediaUrl(url)).toBe(url);
  });

  it('rejects arbitrary external music URLs', () => {
    expect(isAllowedUserMediaUrl('https://evil.example.com/track.mp3')).toBe(false);
    expect(() => parseUserMediaUrl('https://evil.example.com/track.mp3')).toThrow();
  });

  it('allows Unsplash for template backgrounds', () => {
    const url = 'https://images.unsplash.com/photo-123?w=800';
    expect(isAllowedTemplateMediaUrl(url)).toBe(true);
    expect(parseTemplateMediaUrl(url)).toBe(url);
  });

  it('rejects path traversal in uploads', () => {
    expect(isAllowedUserMediaUrl('/uploads/../etc/passwd')).toBe(false);
  });

  it('allows S3 CDN upload URLs when S3_PUBLIC_URL is configured', () => {
    vi.stubEnv('S3_ENDPOINT', 'https://example.r2.cloudflarestorage.com');
    vi.stubEnv('S3_BUCKET', 'QazShaqyru');
    vi.stubEnv('S3_ACCESS_KEY', 'access');
    vi.stubEnv('S3_SECRET_KEY', 'secret');
    vi.stubEnv('S3_PUBLIC_URL', 'https://cdn.qazshaqyru.kz');

    const url = 'https://cdn.qazshaqyru.kz/invitations/abc.webp';
    expect(isAllowedUserMediaUrl(url)).toBe(true);
    expect(parseUserMediaUrl(url)).toBe(url);

    vi.unstubAllEnvs();
  });
});
