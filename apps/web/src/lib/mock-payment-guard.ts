/**
 * Mock payment is only allowed in local development with explicit opt-in.
 * Never callable in production — prevents bypassing real payment providers.
 */
export function isMockPaymentAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_PAYMENT === 'true';
}

export function assertMockPaymentAllowed(): void {
  if (!isMockPaymentAllowed()) {
    throw new Error('Mock payment is disabled');
  }
}
