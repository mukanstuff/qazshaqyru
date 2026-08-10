import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  paymentWebhookEvent: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  order: {
    updateMany: vi.fn(),
  },
}));

const getPaymentProviderMock = vi.hoisted(() => vi.fn());
const completeOrderPaymentMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));
vi.mock('@/lib/payments', () => ({ getPaymentProvider: getPaymentProviderMock }));
vi.mock('@/lib/payments/order-completion', () => ({ completeOrderPayment: completeOrderPaymentMock }));
vi.mock('@/lib/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/shared/api')>();
  return {
    ...actual,
    applyRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetIn: 60_000 }),
  };
});

import { POST } from '@/app/api/orders/webhook/[provider]/route';

describe('orders webhook route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.paymentWebhookEvent.findUnique.mockResolvedValue(null);
    prismaMock.paymentWebhookEvent.create.mockResolvedValue({ id: 'evt-1' });
    prismaMock.paymentWebhookEvent.update.mockResolvedValue({ id: 'evt-1' });
  });

  it('marks duplicate event as already processed', async () => {
    getPaymentProviderMock.mockReturnValue({
      verifyWebhook: vi.fn().mockResolvedValue({
        orderId: 'ord-1',
        action: 'complete',
        paymentId: 'pay-1',
        paidAmountKzt: 14900,
      }),
    });
    prismaMock.paymentWebhookEvent.findUnique.mockResolvedValue({
      id: 'evt-existing',
      processed: true,
      action: 'complete',
      retryCount: 0,
    });

    const request = createTestRequest('http://localhost:3000/api/orders/webhook/kaspi', {
      method: 'POST',
      body: JSON.stringify({ order_id: 'ord-1', status: 'paid', id: 'pay-1', amount: 1490000 }),
      headers: { 'x-kaspi-signature': 'sig' },
    });
    const response = await POST(request, { params: { provider: 'kaspi' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.alreadyProcessed).toBe(true);
    expect(prismaMock.paymentWebhookEvent.create).not.toHaveBeenCalled();
  });

  it('stores event and completes order', async () => {
    getPaymentProviderMock.mockReturnValue({
      verifyWebhook: vi.fn().mockResolvedValue({
        orderId: 'ord-1',
        action: 'complete',
        paymentId: 'pay-1',
        paidAmountKzt: 14900,
      }),
    });
    completeOrderPaymentMock.mockResolvedValue({
      ok: true,
      alreadyPaid: false,
      invitationId: 'inv-1',
    });

    const request = createTestRequest('http://localhost:3000/api/orders/webhook/kaspi', {
      method: 'POST',
      body: JSON.stringify({ order_id: 'ord-1', status: 'paid', id: 'pay-1', amount: 1490000 }),
      headers: { 'x-kaspi-signature': 'sig' },
    });
    const response = await POST(request, { params: { provider: 'kaspi' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.alreadyProcessed).toBe(false);
    expect(prismaMock.paymentWebhookEvent.create).toHaveBeenCalled();
    expect(completeOrderPaymentMock).toHaveBeenCalledWith(
      'ord-1',
      expect.objectContaining({ expectedProvider: 'kaspi', expectedPaymentId: 'pay-1' })
    );
    expect(prismaMock.paymentWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processed: true,
          processingState: 'processed',
          lastError: null,
        }),
      })
    );
  });

  it('reprocesses duplicate event when processed=false', async () => {
    getPaymentProviderMock.mockReturnValue({
      verifyWebhook: vi.fn().mockResolvedValue({
        orderId: 'ord-1',
        action: 'complete',
        paymentId: 'pay-1',
        paidAmountKzt: 14900,
      }),
    });
    completeOrderPaymentMock.mockResolvedValue({
      ok: true,
      alreadyPaid: false,
      invitationId: 'inv-1',
    });
    prismaMock.paymentWebhookEvent.findUnique.mockResolvedValue({
      id: 'evt-existing',
      processed: false,
      action: 'complete',
      retryCount: 1,
    });

    const request = createTestRequest('http://localhost:3000/api/orders/webhook/kaspi', {
      method: 'POST',
      body: JSON.stringify({ order_id: 'ord-1', status: 'paid', id: 'pay-1', amount: 1490000 }),
      headers: { 'x-kaspi-signature': 'sig' },
    });
    const response = await POST(request, { params: { provider: 'kaspi' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.retried).toBe(true);
    expect(prismaMock.paymentWebhookEvent.create).not.toHaveBeenCalled();
    expect(prismaMock.paymentWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'evt-existing' },
        data: expect.objectContaining({
          processingState: 'retry',
          retryCount: { increment: 1 },
        }),
      })
    );
  });

  it('marks event as error for non-retryable completion failure', async () => {
    getPaymentProviderMock.mockReturnValue({
      verifyWebhook: vi.fn().mockResolvedValue({
        orderId: 'ord-1',
        action: 'complete',
        paymentId: 'pay-1',
        paidAmountKzt: 14900,
      }),
    });
    completeOrderPaymentMock.mockResolvedValue({
      ok: false,
      reason: 'amount_mismatch',
    });

    const request = createTestRequest('http://localhost:3000/api/orders/webhook/kaspi', {
      method: 'POST',
      body: JSON.stringify({ order_id: 'ord-1', status: 'paid', id: 'pay-1', amount: 1490000 }),
      headers: { 'x-kaspi-signature': 'sig' },
    });
    const response = await POST(request, { params: { provider: 'kaspi' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('payment_error');
    expect(prismaMock.paymentWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processed: false,
          processingState: 'error',
          lastError: 'amount_mismatch',
        }),
      })
    );
  });

  it('keeps existing unprocessed event in retry state after retryable failure', async () => {
    getPaymentProviderMock.mockReturnValue({
      verifyWebhook: vi.fn().mockResolvedValue({
        orderId: 'ord-1',
        action: 'complete',
        paymentId: 'pay-1',
        paidAmountKzt: 14900,
      }),
    });
    completeOrderPaymentMock.mockResolvedValue({
      ok: false,
      reason: 'provider_pending',
    });
    prismaMock.paymentWebhookEvent.findUnique.mockResolvedValue({
      id: 'evt-existing',
      processed: false,
      action: 'complete',
      retryCount: 2,
    });

    const request = createTestRequest('http://localhost:3000/api/orders/webhook/kaspi', {
      method: 'POST',
      body: JSON.stringify({ order_id: 'ord-1', status: 'paid', id: 'pay-1', amount: 1490000 }),
      headers: { 'x-kaspi-signature': 'sig' },
    });
    const response = await POST(request, { params: { provider: 'kaspi' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('webhook_error');
    expect(prismaMock.paymentWebhookEvent.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: 'evt-existing' },
        data: expect.objectContaining({
          processingState: 'retry',
          retryCount: { increment: 1 },
        }),
      })
    );
    expect(prismaMock.paymentWebhookEvent.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'evt-existing' },
        data: expect.objectContaining({
          processed: false,
          processingState: 'retry',
          lastError: 'provider_pending',
        }),
      })
    );
  });

  it('processes ignore then complete for same paymentId (regression: action-scoped dedupe key)', async () => {
    // The bug: an intermediate/ignore event for the same paymentId was marking
    // the webhook event as processed=true, so the subsequent complete event
    // arrived with the same dedupe key and was dropped as duplicate.
    // Fix: dedupe key includes result.action, so ignore/complete have different keys.
    const verifyMock = vi
      .fn()
      .mockResolvedValueOnce({
        orderId: 'ord-1',
        action: 'ignore', // intermediate status (e.g. processing / pending)
        paymentId: 'pay-1',
      })
      .mockResolvedValueOnce({
        orderId: 'ord-1',
        action: 'complete',
        paymentId: 'pay-1',
        paidAmountKzt: 14900,
      });
    getPaymentProviderMock.mockReturnValue({ verifyWebhook: verifyMock });
    completeOrderPaymentMock.mockResolvedValue({
      ok: true,
      alreadyPaid: false,
      invitationId: 'inv-1',
    });

    // 1) intermediate status — should be processed and not crash
    const ignoreReq = createTestRequest('http://localhost:3000/api/orders/webhook/kaspi', {
      method: 'POST',
      body: JSON.stringify({ order_id: 'ord-1', status: 'processing', id: 'pay-1' }),
      headers: { 'x-kaspi-signature': 'sig' },
    });
    const ignoreRes = await POST(ignoreReq, { params: { provider: 'kaspi' } });
    expect(ignoreRes.status).toBe(200);
    expect((await ignoreRes.json()).data.ignored).toBe(true);

    // 2) final success — MUST NOT be dropped as duplicate
    const completeReq = createTestRequest('http://localhost:3000/api/orders/webhook/kaspi', {
      method: 'POST',
      body: JSON.stringify({ order_id: 'ord-1', status: 'paid', id: 'pay-1', amount: 1490000 }),
      headers: { 'x-kaspi-signature': 'sig' },
    });
    const completeRes = await POST(completeReq, { params: { provider: 'kaspi' } });
    const completeBody = await completeRes.json();

    expect(completeRes.status).toBe(200);
    expect(completeBody.data.alreadyProcessed).toBe(false);
    expect(completeOrderPaymentMock).toHaveBeenCalledWith(
      'ord-1',
      expect.objectContaining({ expectedProvider: 'kaspi', expectedPaymentId: 'pay-1' })
    );
  });
});
