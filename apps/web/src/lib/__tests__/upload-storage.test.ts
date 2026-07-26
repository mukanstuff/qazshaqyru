import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseS3Config,
  isS3StorageConfigured,
  getUploadStorageMode,
  buildUploadPublicUrl,
  getUploadPublicBaseUrl,
  resetUploadStorageCacheForTests,
} from '@/lib/uploads/upload-storage';

describe('upload-storage S3 logic', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetUploadStorageCacheForTests();
    for (const key of [
      'S3_ENDPOINT',
      'S3_BUCKET',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
      'S3_PUBLIC_URL',
      'S3_REGION',
      'APP_URL',
    ]) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = originalEnv;
    resetUploadStorageCacheForTests();
  });

  it('returns null when S3 vars are incomplete', () => {
    process.env.S3_ENDPOINT = 'https://example.r2.cloudflarestorage.com';
    process.env.S3_BUCKET = 'QazShaqyru';
    expect(parseS3Config()).toBeNull();
    expect(isS3StorageConfigured()).toBe(false);
    expect(getUploadStorageMode()).toBe('local');
  });

  it('parses full S3 config and strips trailing slash from public URL', () => {
    process.env.S3_ENDPOINT = 'https://example.r2.cloudflarestorage.com';
    process.env.S3_BUCKET = 'QazShaqyru';
    process.env.S3_ACCESS_KEY = 'access';
    process.env.S3_SECRET_KEY = 'secret';
    process.env.S3_PUBLIC_URL = 'https://cdn.qazshaqyru.kz/';
    process.env.S3_REGION = 'auto';

    const config = parseS3Config();
    expect(config).toEqual({
      endpoint: 'https://example.r2.cloudflarestorage.com',
      bucket: 'QazShaqyru',
      accessKey: 'access',
      secretKey: 'secret',
      region: 'auto',
      publicUrl: 'https://cdn.qazshaqyru.kz',
    });
    expect(getUploadStorageMode()).toBe('s3');
  });

  it('builds CDN public URL in S3 mode', () => {
    process.env.S3_ENDPOINT = 'https://example.r2.cloudflarestorage.com';
    process.env.S3_BUCKET = 'QazShaqyru';
    process.env.S3_ACCESS_KEY = 'access';
    process.env.S3_SECRET_KEY = 'secret';
    process.env.S3_PUBLIC_URL = 'https://cdn.qazshaqyru.kz';

    expect(buildUploadPublicUrl('invitations', 'photo.webp')).toBe(
      'https://cdn.qazshaqyru.kz/invitations/photo.webp'
    );
    expect(getUploadPublicBaseUrl()).toBe('https://cdn.qazshaqyru.kz');
  });

  it('builds local path when S3 is not configured', () => {
    expect(buildUploadPublicUrl('music', 'track.mp3')).toBe('/uploads/music/track.mp3');
    process.env.APP_URL = 'https://qazshaqyru.kz';
    expect(getUploadPublicBaseUrl()).toBe('https://qazshaqyru.kz/uploads');
  });

  it('rejects path traversal in filename', () => {
    expect(() => buildUploadPublicUrl('invitations', '../secret.jpg')).toThrow();
  });

  it('describeUploadStorage reports partial S3 as local with missing keys', async () => {
    const { describeUploadStorage } = await import('@/lib/uploads/upload-storage');
    process.env.S3_ENDPOINT = 'https://example.r2.cloudflarestorage.com';
    const status = describeUploadStorage(process.env);
    expect(status.mode).toBe('local');
    expect(status.missing?.length).toBeGreaterThan(0);
  });
});
