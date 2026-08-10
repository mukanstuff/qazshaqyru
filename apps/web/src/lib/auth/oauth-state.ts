import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { getServerSecret } from '@/lib/auth';

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_RETURN_COOKIE = 'oauth_return';

export function generateOAuthState(): string {
  return randomBytes(24).toString('hex');
}

function signState(value: string): string {
  return createHmac('sha256', getServerSecret()).update(value).digest('hex');
}

export async function setOAuthStateCookie(state: string, returnTo: string | null): Promise<void> {
  const store = await cookies();
  const sig = signState(state);
  store.set(OAUTH_STATE_COOKIE, `${state}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });
  if (returnTo) {
    store.set(OAUTH_RETURN_COOKIE, returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    });
  }
}

export async function readAndClearOAuthState(returnedState: string): Promise<{ returnTo: string | null } | null> {
  const store = await cookies();
  const raw = store.get(OAUTH_STATE_COOKIE)?.value;
  const returnTo = store.get(OAUTH_RETURN_COOKIE)?.value ?? null;
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return null;
  const state = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = signState(state);
  if (sig.length !== expected.length) return null;
  try {
    const ok = timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    if (!ok) return null;
  } catch {
    return null;
  }
  if (state !== returnedState) return null;

  // Clear both cookies (path-scoped delete)
  store.delete(OAUTH_STATE_COOKIE);
  store.delete(OAUTH_RETURN_COOKIE);

  return { returnTo };
}