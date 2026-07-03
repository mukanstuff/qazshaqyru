/**
 * Parse Kaspi Pay API error responses into actionable messages.
 */

export interface KaspiApiErrorDetails {
  status: number;
  code?: string;
  message: string;
  raw?: string;
}

export function parseKaspiApiError(status: number, body: string): KaspiApiErrorDetails {
  let code: string | undefined;
  let message = `Kaspi API error (${status})`;

  try {
    const data = JSON.parse(body) as {
      error?: string;
      code?: string;
      message?: string;
      detail?: string;
    };
    code = data.code ?? data.error;
    message = data.message ?? data.detail ?? message;
  } catch {
    if (body.trim()) {
      message = body.trim().slice(0, 200);
    }
  }

  if (status === 401 || status === 403) {
    message = `Kaspi API: неверный API-ключ (KASPI_API_KEY). ${message}`;
  } else if (status === 404) {
    message = `Kaspi API: endpoint не найден — проверьте KASPI_API_URL. ${message}`;
  } else if (status >= 500) {
    message = `Kaspi API временно недоступен (${status}). Повторите позже.`;
  }

  return { status, code, message, raw: body.slice(0, 500) };
}

export class KaspiPaymentError extends Error {
  constructor(
    public readonly details: KaspiApiErrorDetails
  ) {
    super(details.message);
    this.name = 'KaspiPaymentError';
  }
}
