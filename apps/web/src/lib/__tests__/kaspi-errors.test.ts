import { describe, it, expect } from 'vitest';
import { parseKaspiApiError, KaspiPaymentError } from '@/lib/payments/kaspi-errors';

describe('kaspi-errors', () => {
  it('parses JSON error body', () => {
    const result = parseKaspiApiError(400, JSON.stringify({ code: 'invalid_amount', message: 'Bad amount' }));
    expect(result.code).toBe('invalid_amount');
    expect(result.message).toContain('Bad amount');
  });

  it('adds hint for 401 unauthorized', () => {
    const result = parseKaspiApiError(401, '{}');
    expect(result.message).toContain('KASPI_API_KEY');
  });

  it('wraps in KaspiPaymentError', () => {
    const details = parseKaspiApiError(502, 'upstream error');
    const err = new KaspiPaymentError(details);
    expect(err.name).toBe('KaspiPaymentError');
    expect(err.details.status).toBe(502);
  });
});
