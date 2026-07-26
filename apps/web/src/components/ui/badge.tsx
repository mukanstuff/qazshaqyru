import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/shared/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-body text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-us-accent focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-us-accent/10 text-us-accent',
        draft: 'border-transparent bg-amber-50 text-amber-700',
        published: 'border-transparent bg-us-success/10 text-us-success',
        archived: 'border-transparent bg-slate-100 text-slate-600',
        outline: 'border-us-border text-us-ink-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
