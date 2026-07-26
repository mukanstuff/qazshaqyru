'use client';

import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils';

interface Props {
  variant: 'failed' | 'invalid' | 'published';
  message?: string;
  onDismiss?: () => void;
}

const variantStyles = {
  failed: 'border-us-danger/30 bg-red-50 text-us-danger',
  invalid: 'border-amber-300/50 bg-amber-50 text-amber-800',
  published: 'border-us-success/30 bg-us-success/10 text-us-success',
};

export function PaymentStatusBanner({ variant, message, onDismiss }: Props) {
  const { t } = useI18n();
  const titleKey = `paymentBanner.${variant}.title` as const;
  const defaultMessageKey = `paymentBanner.${variant}.message` as const;

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b px-4 py-3 sm:px-6',
        variantStyles[variant]
      )}
      role="alert"
    >
      <div>
        <p className="font-body text-sm font-semibold">{t(titleKey)}</p>
        <p className="mt-0.5 font-body text-sm opacity-90">{message ?? t(defaultMessageKey)}</p>
      </div>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          aria-label={t('common.close')}
          className="shrink-0 opacity-70 hover:opacity-100"
        >
          ✕
        </Button>
      )}
    </div>
  );
}
