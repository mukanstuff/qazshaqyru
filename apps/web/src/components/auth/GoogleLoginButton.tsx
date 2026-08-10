'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/shared/utils';

interface Props {
  /** Path to redirect to after successful login (must start with `/`). */
  returnTo?: string;
  className?: string;
  /** Children override the default "Войти через Google" label. */
  children?: React.ReactNode;
  /** Disabled state with explanation tooltip. */
  disabledReason?: string | null;
  /** Called immediately before redirect (e.g. to close a parent modal). */
  onClick?: () => void;
}

/**
 * <GoogleLoginButton/> uses the OAuth redirect flow via
 * `/api/auth/google/start?return_to=...`. Works on iOS Safari, Android
 * WebView (incl. Instagram/Telegram), and desktop. We avoid Google
 * Identity Services popup because:
 *  - it's blocked in many in-app browsers;
 *  - iOS shows two prompts instead of one when both popup + redirect are wired;
 *  - redirect is the only flow Google officially supports on mobile WebView.
 */
export function GoogleLoginButton({
  returnTo = '/dashboard',
  className,
  children,
  disabledReason,
  onClick,
}: Props) {
  const [pending, setPending] = useState(false);

  const handleClick = () => {
    onClick?.();
    setPending(true);
    // Browser navigates; no need to await anything.
    const target = `/api/auth/google/start?return_to=${encodeURIComponent(returnTo)}`;
    window.location.href = target;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || !!disabledReason}
      title={disabledReason ?? undefined}
      className={cn(
        'group relative flex w-full items-center justify-center gap-3 rounded-xl',
        'border border-us-border bg-us-surface px-4 py-3',
        'font-body text-base font-semibold text-us-ink',
        'shadow-us-sm transition-all',
        'hover:border-us-accent/40 hover:bg-us-ivory hover:shadow-us-md',
        'active:scale-[0.99]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-us-surface disabled:hover:shadow-us-sm',
        className,
      )}
      data-testid="google-login-button"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin text-us-ink-muted" />
      ) : (
        <GoogleMark className="h-5 w-5 shrink-0" />
      )}
      <span>{children ?? 'Войти через Google'}</span>
    </button>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5l-5.9-5c-2 1.4-4.5 2.3-7 2.3-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l5.9 5c4.1-3.7 7-9.3 7-15.6 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}