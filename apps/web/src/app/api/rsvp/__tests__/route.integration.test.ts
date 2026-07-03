import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJsonPostRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  invitation: { findUnique: vi.fn() },
  guest: { findUnique: vi.fn() },
  guestResponse: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  wish: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  wishLike: {
    findUnique: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ default: prismaMock }));
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

import { POST } from '@/app/api/rsvp/route';

const futureDate = new Date('2030-12-31');

describe('RSVP API integration — attending_no_children', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = 'test-session-secret-minimum-32-chars';
  });

  it('accepts attending_no_children status', async () => {
    const guest = {
      id: 'guest-1',
      hasPlusOne: false,
      invitation: {
        status: 'published',
        eventDate: futureDate,
        eventTime: '18:00',
        eventTimezone: 'Asia/Almaty',
        id: 'inv-1',
        title: 'Той',
        slug: 'toy-2030',
      },
    };

    prismaMock.guest.findUnique.mockResolvedValue(guest);
    prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        guestResponse: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({
            guestId: 'guest-1',
            status: 'attending_no_children',
            dietaryRestrictions: null,
            message: null,
          }),
          update: vi.fn(),
        },
      };
      return fn(tx);
    });

    const request = createJsonPostRequest('http://localhost:3000/api/rsvp', {
      guestToken: 'a'.repeat(32),
      status: 'attending_no_children',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.response.status).toBe('attending_no_children');
  });

  it('rejects invalid RSVP status', async () => {
    const request = createJsonPostRequest('http://localhost:3000/api/rsvp', {
      guestToken: 'b'.repeat(32),
      status: 'maybe_later',
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(prismaMock.guest.findUnique).not.toHaveBeenCalled();
  });

  it('swallows honeypot RSVP submissions', async () => {
    const request = createJsonPostRequest('http://localhost:3000/api/rsvp', {
      guestToken: 'c'.repeat(32),
      status: 'attending',
      website: 'https://spam.example',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.response).toBeNull();
    expect(prismaMock.guest.findUnique).not.toHaveBeenCalled();
  });

  it('rejects RSVP when turnstile is enabled without captchaToken', async () => {
    const prev = process.env.CAPTCHA_PROVIDER;
    const prevSecret = process.env.TURNSTILE_SECRET_KEY;
    process.env.CAPTCHA_PROVIDER = 'turnstile';
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';

    const request = createJsonPostRequest('http://localhost:3000/api/rsvp', {
      guestToken: 'd'.repeat(32),
      status: 'attending',
    });
    const response = await POST(request);
    const body = await response.json();

    process.env.CAPTCHA_PROVIDER = prev;
    process.env.TURNSTILE_SECRET_KEY = prevSecret;

    expect(response.status).toBe(400);
    expect(body.error).toBe('captcha_failed');
    expect(prismaMock.guest.findUnique).not.toHaveBeenCalled();
  });
});
