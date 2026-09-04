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
 * Non-modal for the same reason the inspector is: everything inside it edits
 * the canvas it is sitting on, and you have to be able to see the canvas.
 */
export function EditorSheet({ open, onClose, children, className, title }: Props) {
  const { t } = useI18n();

  return (
    <Sheet modal={false} open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        overlay={false}
        data-canvas-sheet="quick-edit"
        className={cn(
          // Same reasoning as PropertiesPanel: this sheet edits the canvas
          // behind it — texts, photos, music, colours — so it must not dim,
          // blur, block or fully cover it.
          'flex max-h-[58dvh] flex-col',
          'sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-h-[80dvh] sm:w-full sm:max-w-sm sm:translate-x-0 sm:rounded-2xl sm:border',
          className,
        )}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetTitle className="sr-only">{title ?? t('invitation.edit.canvas.fab.title')}</SheetTitle>
        <SheetCloseButton className="absolute right-2 top-2 z-10" />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
