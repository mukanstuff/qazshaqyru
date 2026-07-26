import { NextRequest } from 'next/server';

/** Build a NextRequest for API route handler tests. */
export function createTestRequest(
  url: string,
  init?: RequestInit & { origin?: string }
): NextRequest {
  const headers = new Headers(init?.headers);
  const origin = init?.origin ?? 'http://localhost:3000';
  if (!headers.has('origin')) {
    headers.set('origin', origin);
  }
  if (!headers.has('host')) {
    headers.set('host', new URL(origin).host);
  }
  const { signal, ...rest } = init || {};
  const requestInit: ConstructorParameters<typeof NextRequest>[1] = { ...rest, headers };
  if (signal) {
    requestInit.signal = signal;
  }
  return new NextRequest(url, requestInit);
}

/** JSON POST with same-origin headers for CSRF-protected routes. */
export function createJsonPostRequest(
  url: string,
  body: unknown,
  init?: Omit<RequestInit, 'body' | 'method'>
): NextRequest {
  return createTestRequest(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
    body: JSON.stringify(body),
    ...init,
  });
}
