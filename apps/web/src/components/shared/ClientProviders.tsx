'use client';

import { AuthProvider } from '@/hooks/use-auth';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
