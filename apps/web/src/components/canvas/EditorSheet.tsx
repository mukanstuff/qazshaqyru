'use client';

import type { ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { Sheet, SheetContent, SheetCloseButton, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/shared/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Accessible title — visually hidden by default since callers render their own heading (or none, e.g. tabs). */
  title?: string;
}

/**
 * Bottom sheet used by quick-edit, the wizard, and the mobile element
 * palette. Thin wrapper around the shared `Sheet` primitive (Radix Dialog +
 * Motion drag-to-dismiss) — this used to be a fully hand-rolled dialog with
 * its own pointer-drag close gesture, duplicating what the primitive now
 * does for every sheet in the app.
 *
 * On a phone it is a bottom sheet. On a desktop it used to dock into the
 * bottom-LEFT corner with nothing behind it — 384px of panel floating over the
 * page next to a canvas it did not overlap, which reads as a panel that has
 * come loose rather than one that was placed. It is now a centred card over a
 * dimmed page, which is what it behaves like: the wizard, the texts and the
 * photo picker are forms, and a form is a thing you finish and close.
 *
 * The element inspector is the opposite case and keeps the corner dock: it
 * restyles the element you selected, so covering that element would defeat it.
 */
export function EditorSheet({ open, onClose, children, className, title }: Props) {
  const { t } = useI18n();

  // Modal, because the backdrop is a Radix overlay and Radix renders one only
  // for a modal dialog. That also brings the focus trap and the escape key,
  // both of which a centred form wants.
  return (
    <Sheet modal open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        overlay
        data-canvas-sheet="quick-edit"
        className={cn(
          'flex max-h-[58dvh] flex-col',
          'sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[82dvh] sm:w-[min(440px,calc(100vw-48px))] sm:max-w-none sm:translate-x-0 sm:rounded-2xl sm:border',
          className,
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetTitle className="sr-only">{title ?? t('invitation.edit.canvas.fab.title')}</SheetTitle>
        <SheetCloseButton className="absolute right-2 top-2 z-10" />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
