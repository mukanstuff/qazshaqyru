'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

type ToastType = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

interface ToastContextType {
  toast: (props: Omit<ToastType, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const toast = useCallback((props: Omit<ToastType, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { ...props, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // A fresh `{ toast, dismiss }` object on every render would re-render every
  // consumer in the tree each time a toast is pushed or dismissed.
  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastProvider duration={4000}>
        {children}
        {toasts.map(({ id, title, description, variant = 'default' }) => (
          <Toast
            key={id}
            variant={variant}
            onOpenChange={(open) => {
              if (!open) dismiss(id);
            }}
          >
            <div className="grid gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription>{description}</ToastDescription> : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

/**
 * Stable no-op fallback for trees rendered without <Toaster> (unit tests,
 * isolated stories). Must be a module-level singleton: returning a fresh
 * object literal here gives `toast` a new identity on every render, which
 * turns any `useEffect(..., [toast])` into an infinite loop.
 */
const NOOP_TOAST: ToastContextType = {
  toast: () => {},
  dismiss: () => {},
};

export function useToast() {
  return useContext(ToastContext) ?? NOOP_TOAST;
}
