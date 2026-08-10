'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useI18n } from '@/i18n';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { cn } from '@/lib/shared/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { id: string }) => void;
  title?: string;
  subtitle?: string;
  /** Override where Google OAuth should redirect after success. */
  returnTo?: string;
}

export function LoginModal({ isOpen, onClose, onSuccess, title, subtitle, returnTo }: Props) {
  const { refreshSession } = useAuth();
  const { t } = useI18n();
  const modalTitle = title ?? t('auth.loginTitleV2');
  const modalSubtitle = subtitle ?? t('auth.loginSubtitleV2');

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card className="shadow-us-lg">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-1 text-us-ink-muted transition-colors hover:bg-us-accent/6 hover:text-us-ink"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>

          <CardHeader className="pt-10 text-center">
            <CardTitle className="font-display text-2xl">{modalTitle}</CardTitle>
            <CardDescription>{modalSubtitle}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-2">
            <GoogleLoginButton
              returnTo={returnTo ?? '/dashboard'}
              onClick={() => {
                // The button navigates via window.location.href; we cannot await session
                // here. Close the modal optimistically; refreshSession runs after redirect.
                onClose();
                void refreshSession().then(() => onSuccess?.({ id: 'pending' }));
              }}
            >
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
  );
}