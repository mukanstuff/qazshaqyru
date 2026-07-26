import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createJsonPostRequest, createTestRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  invitation: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
}));

const requireAuthMock = vi.hoisted(() => vi.fn().mockResolvedValue({ user: { id: 'user-1' } }));
const resolveTemplateBySlugMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'wedding-ivory-gold',
    priceKzt: 3990,
    nameRu: 'Айвори голд',
  })
);

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));
vi.mock('@/lib/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/shared/api')>();
  return {
    ...actual,
    requireAuth: requireAuthMock,
    applyRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetIn: 60_000 }),
    applyAuthReadRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetIn: 60_000,
    }),
  };
});
vi.mock('@/lib/templates/template-resolve', () => ({
  resolveTemplateBySlug: resolveTemplateBySlugMock,
}));

import { GET, POST } from '@/app/api/invitations/route';

describe('invitations API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates invitation for authenticated user', async () => {
    prismaMock.invitation.create.mockResolvedValue({
      id: 'inv-1',
      userId: 'user-1',
      slug: 'demo-slug',
      title: 'Айгүл мен Нұрлан',
      eventType: 'wedding',
      eventDate: new Date('2030-12-31T00:00:00.000Z'),
      eventTime: '18:00',
      eventPlace: 'Ресторан Астана',
      eventTimezone: 'Asia/Almaty',
      templateId: '11111111-1111-1111-1111-111111111111',
      templateKey: 'wedding-ivory-gold',
      templateData: {},
      musicUrl: null,
      mapUrl: null,
      address: null,
      customText: { openRsvp: false },
      status: 'draft',
      publishedAt: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createJsonPostRequest('http://localhost:3000/api/invitations', {
      title: 'Айгүл мен Нұрлан',
      eventType: 'wedding',
      eventDate: '2030-12-31',
      eventTime: '18:00',
      eventPlace: 'Ресторан Астана',
      templateId: '11111111-1111-1111-1111-111111111111',
      templateKey: 'wedding-ivory-gold',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(resolveTemplateBySlugMock).toHaveBeenCalledWith('wedding-ivory-gold');
    expect(prismaMock.invitation.create).toHaveBeenCalled();
  });

  it('lists invitations for current user', async () => {
    prismaMock.invitation.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        title: 'Айгүл мен Нұрлан',
        status: 'draft',
        _count: { guests: 2, orders: 1 },
      },
    ]);
    prismaMock.invitation.count.mockResolvedValue(1);

    const request = createTestRequest('http://localhost:3000/api/invitations?page=1&limit=20');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.invitations).toHaveLength(1);
    expect(body.pagination).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });
});
