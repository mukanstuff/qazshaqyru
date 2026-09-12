import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LoginForm from './login-form';
import { getI18n } from '@/i18n/server';
import { sanitizeRedirectPath } from '@/lib/shared/redirect';
import { isGoogleOAuthEnabled } from '@/lib/auth/google-env';

export const dynamic = 'force-dynamic';

/*
 * The tab said "Той мен үйлену тойына онлайн шақыру — …" here too: the route
 * declared no metadata, so it inherited the site's marketing title. Same
 * defect as /dashboard and /settings had.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('auth.loginTitleV2') };
}

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
