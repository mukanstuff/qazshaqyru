'use client';

import { useCallback, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/hooks/use-auth';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/constants';

/**
 * Phone + password sign-in and sign-up.
 *
 * Replaces the WhatsApp one-time-code flow (product decision 2026-09-01): no
 * codes, no verification step. The two modes are an explicit toggle rather than
 * one clever "log in or register" button — with a password field, guessing
 * which the person meant produces the worst possible error message ("wrong
 * password" to someone who has no account yet).
 *
 * The password field has a show/hide toggle instead of a "repeat password"
 * field: there is no reset channel, so letting someone *read back* what they
 * typed protects against the typo better than asking them to type it twice.
 */
type Mode = 'login' | 'register';

export function PhoneLoginForm({ redirectTo }: { redirectTo: string }) {
  const { t } = useI18n();
  const { refreshSession } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('+7');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.message || t('errors.generic'));
        // A number that already exists is the one failure where the fix is to
        // switch modes, so do it for them instead of making them find the tab.
        if (data.error === 'phone_taken') setMode('login');
        return;
      }
      await refreshSession();
      window.location.href = redirectTo;
    } catch {
      setError(t('errors.generic'));
    } finally {
      setPending(false);
    }
  }, [mode, phone, password, redirectTo, refreshSession, t]);

  const phoneValid = /^\+7\d{10}$/.test(phone.replace(/[\s()-]/g, ''));
  const passwordValid =
    mode === 'login' ? password.length > 0 : password.length >= MIN_PASSWORD_LENGTH;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!pending) void submit();
      }}
    >
      <div
        role="tablist"
        aria-label={t('auth.login')}
        className="flex rounded-xl border border-us-border bg-us-ivory p-1"
      >
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`min-h-10 flex-1 rounded-lg font-body text-sm transition-colors ${
              mode === m
                ? 'bg-us-surface font-medium text-us-ink shadow-us-sm'
                : 'text-us-ink-muted hover:text-us-ink'
            }`}
          >
            {m === 'login' ? t('auth.login') : t('auth.register')}
          </button>
        ))}
      </div>

      <label className="block space-y-1.5">
        <span className="font-body text-sm text-us-ink">{t('auth.phone')}</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('auth.phonePlaceholder')}
          className="w-full rounded-xl border border-us-border bg-us-surface px-4 py-3 font-body text-base text-us-ink outline-none transition-colors focus:border-us-accent focus:ring-2 focus:ring-us-accent/20"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="font-body text-sm text-us-ink">{t('auth.password')}</span>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-us-border bg-us-surface px-4 py-3 pr-12 font-body text-base text-us-ink outline-none transition-colors focus:border-us-accent focus:ring-2 focus:ring-us-accent/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-us-ink-muted transition-colors hover:text-us-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mode === 'register' ? (
          <span className="block font-body text-xs text-us-ink-muted">
            {t('auth.passwordHint', { min: MIN_PASSWORD_LENGTH })}
          </span>
        ) : null}
      </label>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-us-danger/30 bg-red-50 px-3 py-2 font-body text-sm text-us-danger"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending || !phoneValid || !passwordValid}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-us-cta px-4 py-3 font-body text-base font-semibold text-white transition-colors hover:bg-us-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {mode === 'login' ? t('auth.loginButton') : t('auth.registerButton')}
      </button>
    </form>
  );
}
