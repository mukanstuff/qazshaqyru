import { redirect } from 'next/navigation';
import { getCurrentSession, type SessionUser } from '@/lib/shared/api';

/**
 * Payment redirect routes must not throw 401 — send user to login with return URL.
 */
export async function requireSessionForPaymentRedirect(
  returnPath: string
): Promise<{ user: SessionUser }> {
  const ctx = await getCurrentSession();
  if (!ctx) {
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }
  return { user: ctx.user };
}
