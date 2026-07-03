import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJsonPostRequest, createTestRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  invitation: { findUnique: vi.fn() },
  wish: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  wishReaction: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({ default: prismaMock }));
vi.mock('@/lib/wish-fingerprint', () => ({
  buildWishLikerHash: vi.fn(() => 'visitor-hash'),
}));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    applyRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetIn: 60_000,
    }),
  };
});

import { GET, POST } from '@/app/api/wishes/route';
import { POST as reactPost } from '@/app/api/wishes/[id]/react/route';

describe('wishes API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns wishes with reaction counts for published invitation', async () => {
    prismaMock.invitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: 'published',
    });
    prismaMock.wish.findMany.mockResolvedValue([
      {
        id: 'wish-1',
        authorName: 'Айгүл',
        text: 'Тілек!',
        createdAt: new Date('2026-06-01T12:00:00Z'),
        reactions: [
          { emoji: 'heart', likerHash: 'other' },
          { emoji: 'heart', likerHash: 'other2' },
          { emoji: 'pray', likerHash: 'other3' },
        ],
      },
    ]);

    const request = createTestRequest('http://localhost:3000/api/wishes?slug=demo-wedding');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.wishes).toHaveLength(1);
    expect(body.wishes[0]).toMatchObject({
      authorName: 'Айгүл',
      likeCount: 3,
      likedByMe: false,
      reactions: { heart: 2, pray: 1, celebrate: 0, clap: 0 },
      myReaction: null,
    });
  });

  it('POST creates sanitized wish on published invitation', async () => {
    prismaMock.invitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: 'published',
    });
    prismaMock.wish.count.mockResolvedValue(0);
    prismaMock.wish.create.mockResolvedValue({
      id: 'wish-new',
      authorName: 'Нұрлан',
      text: 'Құттықтаймыз!',
      createdAt: new Date('2026-06-01T13:00:00Z'),
    });

    const request = createJsonPostRequest('http://localhost:3000/api/wishes', {
      slug: 'demo-wedding',
      authorName: '  Нұрлан  ',
      text: '  Құттықтаймыз!  ',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.wish.authorName).toBe('Нұрлан');
    expect(body.wish.reactions).toEqual({ heart: 0, pray: 0, celebrate: 0, clap: 0 });
    expect(prismaMock.wish.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorName: 'Нұрлан',
          text: 'Құттықтаймыз!',
        }),
      }),
    );
  });

  it('POST rejects unpublished invitation', async () => {
    prismaMock.invitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: 'draft',
    });

    const request = createJsonPostRequest('http://localhost:3000/api/wishes', {
      slug: 'draft-invite',
      authorName: 'Test',
      text: 'Hello world',
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it('POST swallows honeypot submissions', async () => {
    const request = createJsonPostRequest('http://localhost:3000/api/wishes', {
      slug: 'demo-wedding',
      authorName: 'Bot',
      text: 'spam',
      website: 'https://bot.example',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.wish).toBeNull();
    expect(prismaMock.wish.create).not.toHaveBeenCalled();
  });

  it('POST rejects wish when turnstile is enabled without captchaToken', async () => {
    const prev = process.env.CAPTCHA_PROVIDER;
    const prevSecret = process.env.TURNSTILE_SECRET_KEY;
    process.env.CAPTCHA_PROVIDER = 'turnstile';
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';

    const request = createJsonPostRequest('http://localhost:3000/api/wishes', {
      slug: 'demo-wedding',
      authorName: 'Guest',
      text: 'Congrats!',
    });
    const response = await POST(request);
    const body = await response.json();

    process.env.CAPTCHA_PROVIDER = prev;
    process.env.TURNSTILE_SECRET_KEY = prevSecret;

    expect(response.status).toBe(400);
    expect(body.error).toBe('captcha_failed');
    expect(prismaMock.wish.create).not.toHaveBeenCalled();
  });
});

describe('wish react API integration', () => {
  const wishId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST creates emoji reaction on published wish', async () => {
    prismaMock.wish.findUnique.mockResolvedValue({
      id: 'wish-1',
      invitation: { status: 'published' },
    });
    prismaMock.wishReaction.findUnique.mockResolvedValue(null);
    prismaMock.wishReaction.create.mockResolvedValue({ id: 'reaction-1' });
    prismaMock.wishReaction.findMany.mockResolvedValue([
      { emoji: 'celebrate', likerHash: 'visitor-hash' },
    ]);

    const request = createJsonPostRequest(`http://localhost:3000/api/wishes/${wishId}/react`, {
      emoji: 'celebrate',
    });
    const response = await reactPost(request, { params: Promise.resolve({ id: wishId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.myReaction).toBe('celebrate');
    expect(body.reactions.celebrate).toBe(1);
    expect(prismaMock.wishReaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ wishId: 'wish-1', emoji: 'celebrate' }),
      }),
    );
  });

  it('POST updates existing reaction emoji', async () => {
    prismaMock.wish.findUnique.mockResolvedValue({
      id: 'wish-1',
      invitation: { status: 'published' },
    });
    prismaMock.wishReaction.findUnique.mockResolvedValue({
      id: 'reaction-1',
      emoji: 'heart',
    });
    prismaMock.wishReaction.update.mockResolvedValue({ id: 'reaction-1', emoji: 'pray' });
    prismaMock.wishReaction.findMany.mockResolvedValue([
      { emoji: 'pray', likerHash: 'visitor-hash' },
    ]);

    const request = createJsonPostRequest(`http://localhost:3000/api/wishes/${wishId}/react`, {
      emoji: 'pray',
    });
    const response = await reactPost(request, { params: Promise.resolve({ id: wishId }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.myReaction).toBe('pray');
    expect(prismaMock.wishReaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { emoji: 'pray' } }),
    );
  });

  it('POST rejects invalid emoji', async () => {
    const request = createJsonPostRequest(`http://localhost:3000/api/wishes/${wishId}/react`, {
      emoji: 'invalid',
    });
    const response = await reactPost(request, { params: Promise.resolve({ id: wishId }) });

    expect(response.status).toBe(400);
  });
});
