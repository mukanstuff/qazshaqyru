'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/shared/utils';

interface EditorWorkspaceShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  banner?: ReactNode;
  /** Constrain content to us-container-editor (wizard flows) */
  contained?: boolean;
}

export function EditorWorkspaceShell({
  children,
  banner,
  contained = false,
  className,
  ...props
}: EditorWorkspaceShellProps) {
  return (
    <div className={cn('relative min-h-screen bg-white', className)} {...props}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-black/[0.02] blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-us-accent/[0.025] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-black/[0.015] blur-3xl" />
      </div>

      {banner ? <div className="relative z-20">{banner}</div> : null}

      {contained ? (
        <div className="relative us-container-editor">{children}</div>
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      )}
    </div>
  );
}
