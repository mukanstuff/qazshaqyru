import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  invitation: {
    findFirst: vi.fn(),
  },
  guest: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));
vi.mock('@/lib/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/shared/api')>();
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      user: { id: 'user-1' },
    }),
    applyRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetIn: 60_000,
    }),
  };
});

import { GET } from '@/app/api/invitations/[id]/guests/analytics/route';

describe('guest analytics API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns aggregated analytics for invitation guests', async () => {
    prismaMock.invitation.findFirst.mockResolvedValue({ id: 'inv-1' });
    prismaMock.guest.findMany.mockResolvedValue([
      { response: { status: 'attending' } },
      { response: { status: 'attending_plus_one' } },
      { response: { status: 'attending_no_children' } },
      { response: { status: 'not_attending' } },
      { response: null },
    ]);

    const request = createTestRequest('http://localhost:3000/api/invitations/inv-1/guests/analytics');
    const response = await GET(request, { params: Promise.resolve({ id: 'inv-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analytics).toMatchObject({
      total: 5,
      attending: 3,
      notAttending: 1,
      pending: 1,
      responded: 4,
      attendingPercent: 60,
      responsePercent: 80,
      breakdown: {
        attending: 1,
        attending_plus_one: 1,
        attending_no_children: 1,
        not_attending: 1,
        pending: 1,
      },
    });
  });

  it('returns 404 for invitation outside user scope', async () => {
    prismaMock.invitation.findFirst.mockResolvedValue(null);

    const request = createTestRequest('http://localhost:3000/api/invitations/inv-404/guests/analytics');
    const response = await GET(request, { params: Promise.resolve({ id: 'inv-404' }) });

    expect(response.status).toBe(404);
  });
});
