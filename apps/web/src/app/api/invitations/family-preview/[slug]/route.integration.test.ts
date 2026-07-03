import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  invitation: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: prismaMock }));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    applyRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetIn: 60_000 }),
  };
});

import { createPreviewToken } from '@/lib/preview-token';
import { GET } from '@/app/api/invitations/family-preview/[slug]/route';

describe('family preview read API', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = 'test-session-secret-minimum-32-characters';
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts ?preview= token against previewTokenHash', async () => {
    const { token, tokenHash } = createPreviewToken();

    prismaMock.invitation.findUnique.mockResolvedValue({
      slug: 'demo-slug',
      status: 'draft',
      previewTokenHash: tokenHash,
      title: 'Demo',
      eventType: 'wedding',
      eventDate: new Date('2026-07-10T12:00:00.000Z'),
      eventTime: '18:00',
      eventPlace: 'Hall',
      eventTimezone: 'Asia/Almaty',
      templateKey: 'frame',
      templateData: {},
      musicUrl: null,
      mapUrl: null,
      address: null,
      customText: null,
      user: { language: 'ru', name: 'Host' },
      _count: { guests: 0 },
    });

    const request = createTestRequest(
      `http://localhost:3000/api/invitations/family-preview/demo-slug?preview=${encodeURIComponent(token)}`
    );
    const response = await GET(request, { params: Promise.resolve({ slug: 'demo-slug' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.invitation.familyPreview).toBe(true);
  });
});
