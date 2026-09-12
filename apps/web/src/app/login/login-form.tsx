'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { PublicShell } from '@/components/shared/PublicShell';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { PhoneLoginForm } from '@/components/auth/PhoneLoginForm';
import { getWhatsappHref } from '@/lib/site/legal-config';
import { useI18n } from '@/i18n';
import { LANDING_LOGIN_BACKDROP } from '@/lib/landing/assets';
import Image from 'next/image';
import { cn } from '@/lib/shared/utils';

interface Props {
  redirectTo: string;
  googleErrorCode?: string | null;
  /** Server-resolved: is Google OAuth actually configured? */
  googleEnabled: boolean;
}

const panelClassName = cn('us-glass-strong overflow-hidden border shadow-us-lg');

export default function LoginForm({ redirectTo, googleErrorCode, googleEnabled }: Props) {
  const { t } = useI18n();

  return (
    <PublicShell>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={LANDING_LOGIN_BACKDROP}
            alt=""
            fill
            priority={false}
            className="object-cover opacity-15 blur-2xl scale-105"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--us-ivory)_55%,transparent),transparent_52%),linear-gradient(180deg,color-mix(in_srgb,var(--us-cream)_55%,transparent),color-mix(in_srgb,var(--us-ivory)_88%,white_12%))] backdrop-blur-[2px]" />
        </div>

        <div className="us-container flex min-h-[60vh] items-center justify-center py-12">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 font-body text-sm text-us-ink-muted transition-colors hover:text-us-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('auth.backToHome')}
            </Link>

            <Card className={panelClassName}>
              <CardHeader className="space-y-3 border-b border-us-border/70 bg-gradient-to-br from-us-accent/8 via-us-surface to-us-surface text-center">
                {/* The page's own name, so the entry point to the whole cabinet
                    has an `h1`. `CardTitle` renders an `h3`, and it was the only
                    heading on the document. */}
                <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight">
                  {t('auth.loginTitleV2')}
                </h1>
                <CardDescription>
                  {t('auth.loginSubtitleV2')}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-6">
                {googleErrorCode && <ErrorBox message={mapGoogleError(t, googleErrorCode)} />}

                {googleEnabled ? (
                  <>
                    <GoogleLoginButton returnTo={redirectTo}>
                      {t('auth.googleLogin')}
                    </GoogleLoginButton>
                    <p className="text-center font-body text-xs text-us-ink-muted">
                      {t('auth.googleLoginFootnote')}
                    </p>
                  </>
                ) : null}

                {googleEnabled ? (
                  <div className="flex items-center gap-3" aria-hidden>
                    <span className="h-px flex-1 bg-us-border" />
                    <span className="font-body text-xs uppercase tracking-wider text-us-ink-muted">
                      {t('auth.or')}
                    </span>
                    <span className="h-px flex-1 bg-us-border" />
                  </div>
                ) : null}

                <PhoneLoginForm redirectTo={redirectTo} />

                {/* There is no self-service reset: sign-in has no verification
                    channel by design, so "forgot password" has to be a human.
                    Better an honest route to support than a link that 404s or
                    a screen that silently does nothing. */}
                <p className="text-center font-body text-xs text-us-ink-muted">
                  <a
                    href={getWhatsappHref(t('auth.forgotPasswordMessage'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:text-us-accent hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </a>
                </p>

                <p className="text-center font-body text-xs text-us-ink-muted">
                  {t('auth.termsAgree')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-us-danger/30 bg-red-50 px-3 py-2 font-body text-sm text-us-danger"
    >
      {message}
    </div>
  );
}

function mapGoogleError(
  t: (k: string, vars?: Record<string, string | number>) => string,
  code: string,
): string {
  switch (code) {
    case 'access_denied':
      return t('auth.googleErrorAccessDenied');
    case 'invalid_state':
      return t('auth.googleErrorInvalidState');
    case 'invalid_callback':
      return t('auth.googleErrorInvalidCallback');
    case 'exchange_failed':
      return t('auth.googleErrorExchange');
    case 'oauth_disabled':
      return t('auth.googleErrorDisabled');
    default:
      return t('auth.googleErrorGeneric');
  }
}