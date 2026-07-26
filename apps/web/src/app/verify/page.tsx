'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { sanitizeRedirectPath } from '@/lib/shared/redirect';

/** Legacy route — redirects to unified login flow. */
export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const phone = searchParams.get('phone');
    const redirect = sanitizeRedirectPath(searchParams.get('redirect'), '/dashboard');
    const target = phone
      ? `/login?phone=${encodeURIComponent(phone)}&redirect=${encodeURIComponent(redirect)}`
      : `/login?redirect=${encodeURIComponent(redirect)}`;
    router.replace(target);
  }, [router, searchParams]);

  return null;
}
