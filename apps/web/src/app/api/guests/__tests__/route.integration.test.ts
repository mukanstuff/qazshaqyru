import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { buildGuestListWhere, GET } from '@/app/api/guests/route';

const prismaMock = vi.hoisted(() => ({
  invitation: { findFirst: vi.fn() },
  guest: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
}));

const getGuestStatsMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));
vi.mock('@/lib/guests/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/guests/service')>();
  return {
    ...actual,
    getGuestStatsForInvitation: getGuestStatsMock,
  };
});
vi.mock('@/lib/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/shared/api')>();
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      user: { id: 'user-1', phone: '+77071112233', language: 'ru', name: null, isAdmin: false },
      session: {
        id: 's1',
        userId: 'user-1',
        expiresAt: new Date('2030-01-01'),
        tokenHash: 'h',
      },
    }),
    applyAuthReadRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetIn: 60_000,
    }),
  };
});

describe('buildGuestListWhere', () => {
  it('uses Prisma is-filter for attending status', () => {
    expect(buildGuestListWhere('inv-1', 'attending')).toEqual({
      invitationId: 'inv-1',
      response: { is: { status: 'attending' } },
    });
  });

  it('treats missing response as pending', () => {
    expect(buildGuestListWhere('inv-1', 'pending')).toEqual({
      invitationId: 'inv-1',
      OR: [{ response: { is: null } }, { response: { is: { status: 'pending' } } }],
    });
  });
});

describe('GET /api/guests after open RSVP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns guests with response without 500', async () => {
    const invitationId = '4877a167-2280-40a9-a925-7373d1d17fa7';
    prismaMock.invitation.findFirst.mockResolvedValue({ id: invitationId });
    prismaMock.guest.findMany.mockResolvedValue([
      {
        id: 'guest-1',
        invitationId,
        name: 'Guest Audit',
        phone: '+77079990001',
        side: null,
        hasPlusOne: false,
        plusOneName: null,
        householdLabel: null,
        tokenHash: 'secret-should-strip',
        openedAt: null,
        sentAt: null,
        sentVia: null,
        lastError: null,
        createdAt: new Date('2026-07-23T00:00:00Z'),
        updatedAt: new Date('2026-07-23T00:00:00Z'),
        response: {
          id: 'resp-1',
          guestId: 'guest-1',
          status: 'attending',
          dietaryRestrictions: null,
          message: null,
          respondedAt: new Date('2026-07-23T00:00:00Z'),
          updatedAt: new Date('2026-07-23T00:00:00Z'),
        },
      },
    ]);
    prismaMock.guest.count.mockResolvedValue(1);
    getGuestStatsMock.mockResolvedValue({
      total: 1,
      responded: 1,
      pending: 0,
      attending: 1,
      attendingPlusOne: 0,
      attendingNoChildren: 0,
      notAttending: 0,
      expectedGuests: 1,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/guests?invitationId=${invitationId}`
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.guests).toHaveLength(1);
    expect(body.guests[0].name).toBe('Guest Audit');
    expect(body.guests[0].response.status).toBe('attending');
    expect(body.guests[0]).not.toHaveProperty('tokenHash');
    expect(body.stats.attending).toBe(1);
  });

  it('rejects non-UUID invitationId with 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/guests?invitationId=not-a-uuid');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});
