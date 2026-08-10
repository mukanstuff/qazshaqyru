import { redirect } from 'next/navigation';
import LoginForm from './login-form';
import { sanitizeRedirectPath } from '@/lib/shared/redirect';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ redirect?: string; google_error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectParam, google_error: googleError } = await searchParams;
  const redirectTo = sanitizeRedirectPath(redirectParam);

  const { getCurrentSession } = await import('@/lib/shared/api');
  const ctx = await getCurrentSession();
  if (ctx) redirect(redirectTo);

  return <LoginForm redirectTo={redirectTo} googleErrorCode={googleError ?? null} />;
}
