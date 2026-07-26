'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface EditorPanelPortalProps {
  children: ReactNode;
}

/** Renders editor panels at document root so fixed toolbar cannot clip them. */
export function EditorPanelPortal({ children }: EditorPanelPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
