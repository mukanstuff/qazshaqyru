import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/shared/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-body text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFBFC] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[#1F3A2E] text-white shadow-md hover:bg-[#14271F] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
        destructive:
          'bg-[#F97316] text-white shadow-md hover:bg-[#D46141] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
        outline:
          'border-2 border-[#1F3A2E]/20 bg-white text-[#1F3A2E] hover:border-[#1F3A2E]/40 hover:bg-[#1F3A2E]/5 active:bg-[#1F3A2E]/10',
        secondary:
          'bg-[#16A34A]/10 text-[#1F3A2E] hover:bg-[#16A34A]/20 active:bg-[#16A34A]/30',
        ghost:
          'text-[#1F3A2E] hover:bg-[#1F3A2E]/5 active:bg-[#1F3A2E]/10',
        link:
          'text-[#16A34A] underline-offset-4 hover:underline',
        // Алатау variants
        turquoise:
          'bg-[#16A34A] text-white shadow-md hover:bg-[#15803D] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
        peach:
          'bg-[#F59E0B] text-white shadow-md hover:bg-[#E49251] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
        berry:
          'bg-[#F97316] text-white shadow-md hover:bg-[#D46141] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
        cloud:
          'bg-[#BAE6FD] text-[#1F3A2E] shadow-md hover:bg-[#98C8CA] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
        gradient:
          'bg-gradient-to-r from-[#16A34A] to-[#F59E0B] text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#16A34A]/20 active:translate-y-0',
        'warm-outline':
          'border-2 border-[#F59E0B]/40 bg-white text-[#1F3A2E] hover:border-[#F59E0B]/60 hover:bg-[#F59E0B]/10 active:bg-[#F59E0B]/20',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
