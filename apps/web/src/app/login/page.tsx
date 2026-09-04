import { redirect } from 'next/navigation';
import LoginForm from './login-form';
import { sanitizeRedirectPath } from '@/lib/shared/redirect';
import { isGoogleOAuthEnabled } from '@/lib/auth/google-env';

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

  // Google is the only method that can be unavailable — it needs credentials.
  // Phone + password has no external dependency, so it is always offered. The
  // page used to render the Google button unconditionally, so with
  // GOOGLE_CLIENT_ID unset the only control on it led to a 503.
  return (
    <LoginForm
      redirectTo={redirectTo}
      googleErrorCode={googleError ?? null}
      googleEnabled={isGoogleOAuthEnabled()}
    />
  );
}
