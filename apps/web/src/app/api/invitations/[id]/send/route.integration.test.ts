import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createJsonPostRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  invitation: {
    findFirst: vi.fn(),
  },
  guest: {
    count: vi.fn(),
  },
}));

const requireAuthMock = vi.hoisted(() => vi.fn().mockResolvedValue({ user: { id: 'user-1' } }));
const issueGuestInviteLinksMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue([
    {
      id: 'guest-1',
      name: 'Айгүл',
      phone: '+77001234567',
      token: 'guest-token',
      alreadySent: false,
    },
  ])
);
const buildWhatsAppLinkMock = vi.hoisted(() => vi.fn().mockReturnValue('https://wa.me/77001234567'));

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));
vi.mock('@/lib/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/shared/api')>();
  return {
    ...actual,
    requireAuth: requireAuthMock,
    applyRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetIn: 60_000 }),
  };
});
vi.mock('@/lib/guests/service', () => ({
  issueGuestInviteLinks: issueGuestInviteLinksMock,
  buildWhatsAppLink: buildWhatsAppLinkMock,
}));

import { POST } from '@/app/api/invitations/[id]/send/route';

describe('send invites API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('issues personal guest links for a published invitation', async () => {
    prismaMock.invitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      slug: 'demo-slug',
      title: 'Айгүл мен Нұрлан',
      status: 'published',
      user: { language: 'kz' },
    });
    prismaMock.guest.count.mockResolvedValue(1);

    const request = createJsonPostRequest('http://localhost:3000/api/invitations/inv-1/send', {});
    const response = await POST(request, { params: Promise.resolve({ id: 'inv-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(issueGuestInviteLinksMock).toHaveBeenCalledWith('inv-1', undefined, { reissue: false });
    expect(body.guests[0]).toMatchObject({
      id: 'guest-1',
      inviteUrl: 'http://localhost:3000/i/demo-slug?guest=guest-token',
      whatsappLink: 'https://wa.me/77001234567',
    });
    expect(body.stats).toMatchObject({ issued: 1, total: 1 });
  });
});
