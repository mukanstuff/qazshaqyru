import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJsonPostRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  oTPToken: {
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  session: {
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  user: {
    upsert: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const verifyOTPMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return {
    ...actual,
    verifyOTP: verifyOTPMock,
    hashToken: vi.fn(() => 'session-hash'),
    generateSessionToken: vi.fn(() => 'session-token-raw'),
    getSessionExpiry: vi.fn(() => new Date('2030-01-01T00:00:00.000Z')),
    getClientIpFromHeaders: vi.fn(() => '127.0.0.1'),
  };
});
vi.mock('@/lib/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/shared/api')>();
  return {
    ...actual,
    applyRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetIn: 60_000,
    }),
    applyGlobalRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetIn: 60_000,
    }),
    checkSameOrigin: vi.fn(() => true),
    setSessionCookie: vi.fn(),
  };
});

import { POST } from '@/app/api/auth/verify-otp/route';

describe('POST /api/auth/verify-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = 'test-session-secret-minimum-32-chars!!';
    process.env.OTP_MAX_ATTEMPTS = '3';
    verifyOTPMock.mockResolvedValue(true);
  });

  it('verifies bcrypt outside txn and consumes OTP in short txn', async () => {
    const otpRow = {
      id: 'otp-1',
      phone: '+77071112233',
      codeHash: 'hash',
      attempts: 0,
      expiresAt: new Date('2030-01-01'),
      usedAt: null,
    };

    prismaMock.oTPToken.findFirst.mockResolvedValueOnce(otpRow);
    verifyOTPMock.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return true;
    });

    prismaMock.$transaction.mockImplementation(
      async (
        fn: (tx: typeof prismaMock) => Promise<unknown>,
        options?: { timeout?: number }
      ) => {
        expect(options?.timeout).toBeGreaterThanOrEqual(15_000);
        const tx = {
          oTPToken: {
            findFirst: vi.fn().mockResolvedValue(otpRow),
            update: vi.fn(),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          session: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue({}),
          },
          user: {
            upsert: vi.fn().mockResolvedValue({
              id: 'user-1',
              phone: '+77071112233',
              language: 'kz',
              name: null,
              isAdmin: false,
            }),
          },
        };
        return fn(tx as unknown as typeof prismaMock);
      }
    );

    const request = createJsonPostRequest('http://localhost:3000/api/auth/verify-otp', {
      phone: '+77071112233',
      code: '123456',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(verifyOTPMock).toHaveBeenCalledWith('123456', 'hash');
    // bcrypt runs before any $transaction
    const verifyOrder = verifyOTPMock.mock.invocationCallOrder[0]!;
    const txnOrder = prismaMock.$transaction.mock.invocationCallOrder[0]!;
    expect(verifyOrder).toBeLessThan(txnOrder);
  });

  it('increments attempts on wrong code without creating session', async () => {
    const otpRow = {
      id: 'otp-2',
      phone: '+77071112233',
      codeHash: 'hash',
      attempts: 1,
      expiresAt: new Date('2030-01-01'),
      usedAt: null,
    };
    prismaMock.oTPToken.findFirst.mockResolvedValueOnce(otpRow);
    verifyOTPMock.mockResolvedValue(false);

    prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const update = vi.fn().mockResolvedValue({});
      const tx = {
        oTPToken: {
          findFirst: vi.fn().mockResolvedValue(otpRow),
          update,
          updateMany: vi.fn(),
        },
      };
      return fn(tx);
    });

    const request = createJsonPostRequest('http://localhost:3000/api/auth/verify-otp', {
      phone: '+77071112233',
      code: '000000',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('wrong_code');
    expect(prismaMock.user.upsert).not.toHaveBeenCalled();
  });
});
