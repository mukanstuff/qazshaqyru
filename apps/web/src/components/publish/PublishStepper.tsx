'use client';

import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

export type PublishStep = 'create' | 'guests' | 'pay';

interface Props {
  current: PublishStep;
  needsPayment?: boolean;
  variant?: 'full' | 'wizard';
  className?: string;
}

const STEPS: PublishStep[] = ['create', 'guests', 'pay'];

export function PublishStepper({
  current,
  needsPayment = true,
  variant = 'full',
  className,
}: Props) {
  const { t } = useI18n();

  const visibleSteps = needsPayment ? STEPS : STEPS.filter((s) => s !== 'pay');
  const currentIndex = Math.max(0, visibleSteps.indexOf(current));
  const isWizard = variant === 'wizard';
  const onDark = className?.includes('on-dark');

  const labels: Record<PublishStep, string> = {
    create: t('publishFlow.stepCreate'),
    guests: t('publishFlow.stepGuests'),
    pay: t('publishFlow.stepPay'),
  };

  return (
    <nav
      aria-label={t('publishFlow.ariaLabel')}
      className={cn(
        'flex max-w-full items-center gap-1 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        isWizard ? 'justify-center' : 'flex-wrap sm:overflow-visible',
        className,
      )}
    >
      {visibleSteps.map((step, index) => {
        const done = index < currentIndex;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-1">
            {index > 0 && (
              <span
                className={cn(
                  'mx-1 h-px w-4 sm:w-8',
                  onDark ? 'bg-white/30' : 'bg-us-border',
                  done && !onDark && 'bg-us-accent/40'
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-body text-xs',
                active && onDark && 'bg-white/15 text-white',
                active && !onDark && 'bg-us-accent/10 text-us-accent',
                done && !active && onDark && 'text-white/70',
                done && !active && !onDark && 'text-us-ink-muted',
                !done && !active && onDark && 'text-white/50',
                !done && !active && !onDark && 'text-us-ink-muted'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  done && 'bg-us-accent text-white',
                  active && !done && 'bg-us-cta text-us-accent-strong',
                  !done && !active && onDark && 'border border-white/30 text-white/60',
                  !done && !active && !onDark && 'border border-us-border text-us-ink-muted'
                )}
              >
                {done ? '✓' : index + 1}
              </span>
              {!isWizard ? <span>{labels[step]}</span> : null}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
