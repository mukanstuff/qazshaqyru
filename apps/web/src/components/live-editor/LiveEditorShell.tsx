'use client';

import { useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/shared/utils';
import './live-editor.css';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function LiveEditorShell({ children, className, ...props }: Props) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <div className={cn('live-editor-shell flex flex-col', className)} {...props}>
      <div className="live-editor-shell__chrome-glow" aria-hidden />
      {children}
    </div>
  );
}
