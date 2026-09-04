'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, useDragControls, type PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/shared/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[70] bg-us-ink/40 backdrop-blur-[2px]',
      'data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const sheetVariants = cva(
  'fixed z-[71] flex flex-col gap-0 bg-us-surface shadow-us-xl',
  {
    variants: {
      side: {
        bottom:
          'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl border-t border-us-border data-[state=open]:animate-sheet-in-bottom data-[state=closed]:animate-sheet-out-bottom',
        right:
          'inset-y-0 right-0 h-full w-full max-w-sm border-l border-us-border data-[state=open]:animate-sheet-in-right data-[state=closed]:animate-sheet-out-right',
      },
    },
    defaultVariants: {
      side: 'bottom',
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** Show the drag handle + enable swipe-to-close (bottom sheets only). */
  draggable?: boolean;
  /**
   * Dim + blur everything behind the sheet. That is right for a sheet which
   * asks a question and wrong for one that edits what is behind it: the
   * canvas inspector spent its whole life hiding the very element you opened
   * it to restyle. Pair `overlay={false}` with `modal={false}` on `Sheet` so
   * the content behind stays both visible and clickable.
   */
  overlay?: boolean;
}

/**
 * Single shared sheet/drawer primitive for the whole app: a bottom sheet on
 * narrow layouts, or a right-side drawer where that reads better (`side="right"`).
 * Enter/exit animation is driven by Radix's own data-state CSS animation
 * presence detection (see tailwind.config.ts `sheet-in-*`/`sheet-out-*`) —
 * swipe-to-dismiss on top of that uses Motion's drag gesture on the handle.
 */
const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'bottom', draggable = true, overlay = true, className, children, ...props }, ref) => {
  const dragControls = useDragControls();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

  const handleDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const shouldClose = info.offset.y > 120 || info.velocity.y > 500;
    if (shouldClose) {
      contentRef.current?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
    }
  };

  return (
    <SheetPortal>
      {overlay ? <SheetOverlay /> : null}
      <DialogPrimitive.Content
        ref={contentRef}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {side === 'bottom' && draggable && (
          <motion.div
            className="flex shrink-0 cursor-grab touch-none items-center justify-center py-2.5 active:cursor-grabbing"
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            <span className="h-1.5 w-10 rounded-full bg-us-border-strong" aria-hidden />
          </motion.div>
        )}
        {children}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = DialogPrimitive.Content.displayName;

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 border-b border-us-border px-4 pb-3',
        className
      )}
      {...props}
    />
  );
}

function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto overscroll-contain px-4 py-4', className)}
      {...props}
    />
  );
}

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-display text-base font-semibold text-us-ink', className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('font-body text-sm text-us-ink-muted', className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

function SheetCloseButton({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-us-ink-muted transition-colors hover:bg-us-border/40 hover:text-us-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-us-accent',
        className
      )}
      aria-label="Закрыть"
      {...props}
    >
      <X className="h-4 w-4" />
    </DialogPrimitive.Close>
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
  SheetCloseButton,
};
