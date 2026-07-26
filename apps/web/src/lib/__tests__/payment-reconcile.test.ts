import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  order: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));

import { reconcilePendingPayments } from '@/lib/payments/payment-sync';

describe('reconcilePendingPayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates paid and pending counters', async () => {
    prismaMock.order.findMany.mockResolvedValue([
      { id: 'o1', userId: 'u1' },
      { id: 'o2', userId: 'u2' },
      { id: 'o3', userId: null },
    ]);
    const syncOrderPaymentStatusMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 'paid', invitationId: 'inv-1' })
      .mockResolvedValueOnce({ status: 'pending' });

    const result = await reconcilePendingPayments(10, syncOrderPaymentStatusMock);

    expect(result).toEqual({
      scanned: 3,
      paid: 1,
      stillPending: 2,
    });
    expect(syncOrderPaymentStatusMock).toHaveBeenCalledTimes(2);
  });
});
