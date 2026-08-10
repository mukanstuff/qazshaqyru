'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicShell } from '@/components/shared/PublicShell';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { useI18n } from '@/i18n';
import { LANDING_HERO_SCREEN } from '@/lib/landing/assets';
import Image from 'next/image';
import { cn } from '@/lib/shared/utils';

interface Props {
  redirectTo: string;
  googleErrorCode?: string | null;
}

const panelClassName = cn('us-glass-strong overflow-hidden border shadow-us-lg');

export default function LoginForm({ redirectTo, googleErrorCode }: Props) {
  const { t } = useI18n();

  return (
    <PublicShell>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={LANDING_HERO_SCREEN}
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
                <CardTitle className="font-display text-2xl">
                  {t('auth.loginTitleV2')}
                </CardTitle>
                <CardDescription>
                  {t('auth.loginSubtitleV2')}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-6">
                {googleErrorCode && <ErrorBox message={mapGoogleError(t, googleErrorCode)} />}

                <GoogleLoginButton returnTo={redirectTo}>
                  {t('auth.googleLogin')}
                </GoogleLoginButton>

                <p className="text-center font-body text-xs text-us-ink-muted">
                  {t('auth.googleLoginFootnote')}
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