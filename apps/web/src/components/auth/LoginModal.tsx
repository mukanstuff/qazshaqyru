'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, X, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';

type Step = 'phone' | 'code';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { id: string }) => void;
  title?: string;
  subtitle?: string;
}

export function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
}: Props) {
  const { refreshSession } = useAuth();
  const { t } = useI18n();
  const modalTitle = title ?? t('auth.phoneLoginTitle');
  const modalSubtitle = subtitle ?? t('auth.loginSubtitle');
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setPhone('');
      setCode(['', '', '', '', '', '']);
      setError('');
      setDevCode(null);
      setResendCooldown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const d = digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits;
    if (d.length === 0) return '+7';
    if (d.length <= 3) return `+7 (${d}`;
    if (d.length <= 6) return `+7 (${d.slice(0, 3)}) ${d.slice(3)}`;
    if (d.length <= 8) return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    setError('');
  };

  const requestOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка отправки');
      if (data.devCode) setDevCode(data.devCode);
      setResendCooldown(60);
      setStep('code');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = useCallback(
    async (codeToVerify: string) => {
      if (codeToVerify.length !== 6) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code: codeToVerify }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.devCode) setDevCode(data.devCode);
          throw new Error(data.message || 'Неверный код');
        }
        await refreshSession();
        onSuccess?.(data.user);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка');
      } finally {
        setLoading(false);
      }
    },
    [phone, onSuccess, onClose, refreshSession],
  );

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && newCode.every((d) => d)) {
      void verifyOtp(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);
    if (pasted.length === 6) void verifyOtp(pasted);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
      <Card className="shadow-us-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-us-ink-muted transition-colors hover:bg-us-accent/6 hover:text-us-ink"
          aria-label="Закрыть"
        >
          <X size={18} />
        </button>

        {step === 'code' && (
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setCode(['', '', '', '', '', '']);
              setError('');
            }}
            className="absolute left-4 top-4 rounded-md p-1 text-us-ink-muted transition-colors hover:bg-us-accent/6 hover:text-us-ink"
            aria-label={t('auth.changePhone')}
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <CardHeader className="pt-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-us-accent/8 text-us-accent">
            <Phone className="h-5 w-5" />
          </div>

          <CardTitle className="font-display text-2xl">
            {step === 'phone' ? modalTitle : t('auth.enterCodeTitle')}
          </CardTitle>
          <CardDescription>
            {step === 'phone' ? modalSubtitle : t('auth.codeSentTo', { phone })}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'phone' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void requestOtp();
              }}
              className="space-y-4"
            >
              <Input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder={t('auth.phonePlaceholder')}
                autoComplete="tel"
                autoFocus
                inputMode="tel"
                required
              />
              {error && <ErrorBox message={error} />}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || phone.replace(/\D/g, '').length < 11}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('auth.sending')}
                  </>
                ) : (
                  t('auth.getCode')
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-12 w-10 text-center text-lg"
                  />
                ))}
              </div>

              {error && <ErrorBox message={error} />}

              {devCode && (
                <div className="rounded-md border border-us-border bg-us-ivory px-3 py-2 text-center">
                  <p className="font-body text-sm text-us-ink-muted">
                    {t('auth.devCodeHint')}:{' '}
                    <span className="font-mono font-semibold text-us-accent">{devCode}</span>
                  </p>
                </div>
              )}

              <Button
                type="button"
                onClick={() => void verifyOtp(code.join(''))}
                className="w-full"
                disabled={loading || code.some((d) => !d)}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('auth.checking')}
                  </>
                ) : (
                  t('auth.verify')
                )}
              </Button>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="font-body text-sm text-us-ink-muted">
                    {t('auth.resendIn', { seconds: resendCooldown })}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void requestOtp()}
                    className="font-body text-sm text-us-accent underline-offset-4 hover:underline"
                  >
                    {t('auth.resendCode')}
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="mt-6 text-center font-body text-xs text-us-ink-muted">
            {t('auth.termsAgree')}
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border border-us-danger/30 bg-red-50 px-3 py-2',
        'font-body text-sm text-us-danger',
      )}
    >
      {message}
    </div>
  );
}
