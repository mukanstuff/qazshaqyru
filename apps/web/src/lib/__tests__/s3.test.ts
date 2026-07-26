import { describe, it, expect } from 'vitest';
import {
  assertSafeUploadFilename,
  buildS3ObjectKey,
  getS3MissingConfigKeys,
  isValidPublicObjectPath,
  isValidUploadSubdir,
  parsePublicObjectPath,
  validateS3UrlSeparation,
} from '@/lib/uploads/s3';

describe('s3 path validation', () => {
  it('accepts allowed upload subdirs', () => {
    expect(isValidUploadSubdir('invitations')).toBe(true);
    expect(isValidUploadSubdir('music')).toBe(true);
    expect(isValidUploadSubdir('etc')).toBe(false);
  });

  it('rejects path traversal in filenames', () => {
    expect(() => assertSafeUploadFilename('../secret.jpg')).toThrow('invalid_filename');
    expect(() => assertSafeUploadFilename('')).toThrow('invalid_filename');
  });

  it('builds object keys under invitations or music', () => {
    expect(buildS3ObjectKey('invitations', 'photo.webp')).toBe('invitations/photo.webp');
    expect(() => buildS3ObjectKey('invitations', '../x.jpg')).toThrow('invalid_filename');
  });

  it('validates public object paths', () => {
    expect(isValidPublicObjectPath('/invitations/photo.webp')).toBe(true);
    expect(isValidPublicObjectPath('/uploads/music/track.mp3')).toBe(true);
    expect(isValidPublicObjectPath('/uploads/../etc/passwd')).toBe(false);
    expect(isValidPublicObjectPath('/other/file.jpg')).toBe(false);
  });

  it('parses public object path components', () => {
    expect(parsePublicObjectPath('/music/song.mp3')).toEqual({
      subdir: 'music',
      filename: 'song.mp3',
    });
    expect(parsePublicObjectPath('/uploads/invitations/x.png')).toEqual({
      subdir: 'invitations',
      filename: 'x.png',
    });
    expect(parsePublicObjectPath('/bad')).toBeNull();
  });

  it('reports missing S3 config keys', () => {
    expect(getS3MissingConfigKeys({ S3_BUCKET: 'x' })).toContain('S3_ENDPOINT');
  });

  it('warns when public URL equals API endpoint', () => {
    const msg = validateS3UrlSeparation({
      S3_ENDPOINT: 'https://acct.r2.cloudflarestorage.com',
      S3_PUBLIC_URL: 'https://acct.r2.cloudflarestorage.com',
    });
    expect(msg).toContain('S3_PUBLIC_URL');
  });

  it('warns when public URL uses r2 API host', () => {
    const msg = validateS3UrlSeparation({
      S3_ENDPOINT: 'https://acct.r2.cloudflarestorage.com',
      S3_PUBLIC_URL: 'https://bucket.acct.r2.cloudflarestorage.com',
    });
    expect(msg).toContain('cloudflarestorage');
  });
});
