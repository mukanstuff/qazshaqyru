import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createJsonPostRequest } from '@/test/helpers/api-request';

const prismaMock = vi.hoisted(() => ({
  invitation: {
    updateMany: vi.fn(),
  },
}));

const requireAuthMock = vi.hoisted(() => vi.fn().mockResolvedValue({ user: { id: 'user-1' } }));
const checkoutInvitationMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    published: false,
    needsPayment: true,
    paymentUrl: 'http://localhost:3000/mock-payment?orderId=order-1&token=pay-1',
    publicUrl: null,
    orderId: 'order-1',
    // 2026-07-30: test uses a placeholder amount. Real amount comes from resolvePublicationPriceKzt(template.priceKzt) + fullAccess model.
    amountKzt: 3990,
    invitationId: 'inv-1',
    slug: 'demo-slug',
  })
);
const getInvitationPricingMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ templateId: 'template-1' })
);

vi.mock('@/lib/shared/db', () => ({ default: prismaMock }));
vi.mock('@/lib/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/shared/api')>();
  return {
    ...actual,
    requireAuth: requireAuthMock,
    applyRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetIn: 60_000 }),
  };
});
vi.mock('@/lib/payments/checkout', () => ({
  checkoutInvitation: checkoutInvitationMock,
}));
vi.mock('@/lib/invitations/invitation-pricing', () => ({
  getInvitationPricing: getInvitationPricingMock,
}));

import { POST } from '@/app/api/invitations/[id]/checkout/route';

describe('invitation checkout API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts mock checkout and syncs template id', async () => {
    const request = createJsonPostRequest('http://localhost:3000/api/invitations/inv-1/checkout', {
      provider: 'mock',
    });
    const response = await POST(request, { params: Promise.resolve({ id: 'inv-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prismaMock.invitation.updateMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', userId: 'user-1', templateId: null },
      data: { templateId: 'template-1' },
    });
    expect(checkoutInvitationMock).toHaveBeenCalledWith(
      'inv-1',
      { id: 'user-1' },
      expect.objectContaining({ provider: 'mock', appUrl: 'http://localhost:3000', intent: 'pay' })
    );
    expect(body.paymentUrl).toContain('/mock-payment');
  });
});
