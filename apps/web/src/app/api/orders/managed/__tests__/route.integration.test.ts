import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJsonPostRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  template: { findUnique: vi.fn() },
  order: { create: vi.fn() },
}));

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));
vi.mock('@/lib/shared/notifications', () => ({
  sendManagedOrderNotification: vi.fn().mockResolvedValue(true),
}));
vi.mock('@/lib/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/shared/api')>();
  return {
    ...actual,
    applyRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetIn: 60_000,
    }),
  };
});

import { POST } from '@/app/api/orders/managed/route';

describe('Managed order API — captcha', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = 'test-session-secret-minimum-32-chars';
    process.env.CAPTCHA_PROVIDER = 'stub';
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it('rejects when turnstile is enabled without captchaToken', async () => {
    const prev = process.env.CAPTCHA_PROVIDER;
    const prevSecret = process.env.TURNSTILE_SECRET_KEY;
    process.env.CAPTCHA_PROVIDER = 'turnstile';
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';

    const request = createJsonPostRequest('http://localhost:3000/api/orders/managed', {
      templateId: '00000000-0000-4000-8000-000000000001',
      customerName: 'Айгуль',
      customerPhone: '+77001234567',
    });

    const response = await POST(request);
    const body = await response.json();

    process.env.CAPTCHA_PROVIDER = prev;
    process.env.TURNSTILE_SECRET_KEY = prevSecret;

    expect(response.status).toBe(400);
    expect(body.error).toBe('captcha_failed');
  });

  it('creates order when captcha is stub', async () => {
    prismaMock.template.findUnique.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      nameRu: 'Той',
      priceKzt: 15000,
      isActive: true,
    });
    prismaMock.order.create.mockResolvedValue({
      id: 'order-1',
      amountKzt: 15000,
    });

    const request = createJsonPostRequest('http://localhost:3000/api/orders/managed', {
      templateId: '00000000-0000-4000-8000-000000000001',
      customerName: 'Айгуль',
      customerPhone: '+77001234567',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.order.id).toBe('order-1');
  });
});
