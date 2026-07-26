import { describe, it, expect, beforeAll } from 'vitest';
import { createUploadToken, verifyUploadToken } from '@/lib/uploads/upload-token';

const INVITATION_ID = '11111111-1111-4111-8111-111111111111';

beforeAll(() => {
  process.env.SESSION_SECRET = 'test-secret-at-least-32-characters-long';
});

describe('upload token', () => {
  it('creates and verifies a draft token', () => {
    const { token } = createUploadToken({ type: 'draft' });
    expect(verifyUploadToken(token, { type: 'draft' })).toBe(true);
  });

  it('creates and verifies an invitation-scoped token', () => {
    const { token } = createUploadToken({ type: 'invitation', invitationId: INVITATION_ID });
    expect(verifyUploadToken(token, { type: 'invitation', invitationId: INVITATION_ID })).toBe(true);
    expect(verifyUploadToken(token, { type: 'draft' })).toBe(false);
  });

  it('rejects tampered tokens', () => {
    const { token } = createUploadToken({ type: 'draft' });
    expect(verifyUploadToken(`${token}x`, { type: 'draft' })).toBe(false);
  });

  it('rejects expired tokens', () => {
    const { token } = createUploadToken({ type: 'draft' });
    const parts = token.split('.');
    const expired = `${Date.now() - 1000}.${parts[1]}.${parts[2]}.${parts[3]}`;
    expect(verifyUploadToken(expired, { type: 'draft' })).toBe(false);
  });
});
