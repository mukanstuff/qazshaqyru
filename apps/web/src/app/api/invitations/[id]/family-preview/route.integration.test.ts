import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJsonPostRequest } from '@/test/helpers/api-request';
import { issuePreviewToken } from '@/lib/invitations/preview-token';

const prismaMock = vi.hoisted(() => ({
  invitation: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));

const requireAuthMock = vi.hoisted(() => vi.fn().mockResolvedValue({ user: { id: 'user-1' } }));

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));
vi.mock('@/lib/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/shared/api')>();
  return {
    ...actual,
    requireAuth: requireAuthMock,
    applyRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetIn: 60_000 }),
  };
});

import { POST } from '@/app/api/invitations/[id]/family-preview/route';

describe('invitation family preview API', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = 'test-session-secret-minimum-32-characters';
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.invitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      slug: 'demo-slug',
      status: 'draft',
      previewTokenHash: null,
      customText: {
        greeting: 'hello',
        familyPreviewToken: 'legacy-token',
        familyPreviewTokenHash: 'legacy-hash',
      },
    });
    prismaMock.invitation.update.mockResolvedValue({ id: 'inv-1' });
  });

  it('stores only previewTokenHash and returns ?preview= URL', async () => {
    const request = createJsonPostRequest('http://localhost:3000/api/invitations/inv-1/family-preview', {});
    const response = await POST(request, { params: Promise.resolve({ id: 'inv-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toContain('/i/demo-slug?preview=');
    expect(prismaMock.invitation.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        customText: { greeting: 'hello' },
        previewTokenHash: expect.any(String),
      },
    });
  });

  it('reuses existing hash when rotate=false', async () => {
    prismaMock.invitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      slug: 'demo-slug',
      status: 'draft',
      previewTokenHash: 'a'.repeat(64),
      customText: { greeting: 'hello' },
    });

    const request = createJsonPostRequest('http://localhost:3000/api/invitations/inv-1/family-preview', {});
    const response = await POST(request, { params: Promise.resolve({ id: 'inv-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rotated).toBe(false);
    expect(body.url).toBe(
      `http://localhost:3000/i/demo-slug?preview=${encodeURIComponent(issuePreviewToken('a'.repeat(64)))}`
    );
    expect(prismaMock.invitation.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        customText: { greeting: 'hello' },
        previewTokenHash: 'a'.repeat(64),
      },
    });
  });
});
