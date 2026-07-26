'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

interface EditorPanelShellProps {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/** Mobile-first panel chrome: fullscreen sheet on narrow screens, floating card on desktop. */
export function EditorPanelShell({ title, onClose, children, className }: EditorPanelShellProps) {
  const { t } = useI18n();

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[55] bg-us-ink/40 backdrop-blur-[2px] lg:bg-us-ink/25"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-[60] flex flex-col bg-us-surface shadow-us-lg',
          'inset-0 lg:inset-auto lg:right-4 lg:top-[calc(var(--kz-editor-toolbar-h,4rem)+1rem)] lg:max-h-[calc(100vh-var(--kz-editor-toolbar-h,4rem)-2rem)] lg:w-96 lg:rounded-lg lg:border lg:border-us-border',
          className
        )}
      >
        {title ? (
          <div className="flex shrink-0 items-center justify-between border-b border-us-border px-4 py-3">
            <p className="font-display text-base font-medium text-us-ink">{title}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">{children}</div>
      </div>
    </>
  );
}
