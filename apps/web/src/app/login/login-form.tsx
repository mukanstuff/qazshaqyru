'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PublicShell } from '@/components/shared/PublicShell';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';
import { LANDING_HERO_SCREEN } from '@/lib/landing/assets';
import { cn } from '@/lib/shared/utils';

interface Props {
  redirectTo: string;
}

const panelClassName = cn('us-glass-strong overflow-hidden border shadow-us-lg');

export default function LoginForm({ redirectTo }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useI18n();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  useEffect(() => {
    const rawPhone = searchParams.get('phone');
    if (!rawPhone) return;
    setPhone(formatPhone(rawPhone));
  }, [searchParams]);

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
      const msg = e instanceof Error ? e.message : 'Ошибка';
      setError(msg);
      toast({ title: t('auth.sendFailed'), description: msg, variant: 'destructive' });
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
        router.push(redirectTo);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Ошибка';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [phone, redirectTo, router],
  );

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && newCode.every((d) => d)) void verifyOtp(newCode.join(''));
  };

  return (
    <PublicShell>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={LANDING_HERO_SCREEN}
            alt=""
            fill
            priority={false}
            className="object-cover opacity-15 blur-2xl scale-105"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--us-ivory)_55%,transparent),transparent_52%),linear-gradient(180deg,color-mix(in_srgb,var(--us-cream)_55%,transparent),color-mix(in_srgb,var(--us-ivory)_88%,white_12%))] backdrop-blur-[2px]" />
        </div>
        <div className="us-container flex min-h-[60vh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 font-body text-sm text-us-ink-muted transition-colors hover:text-us-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auth.backToHome')}
          </Link>

          <Card className="us-glass-strong overflow-hidden border shadow-us-lg">
            <CardHeader className="space-y-4 border-b border-us-border/70 bg-gradient-to-br from-us-accent/8 via-us-surface to-us-surface text-left sm:text-center">
              <div className="flex items-center gap-3 sm:flex-col sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-us-accent/10 text-us-accent">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="space-y-1">

                  <CardTitle className="font-display text-2xl">
                    {step === 'phone' ? t('auth.phoneLoginTitle') : t('auth.enterCodeTitle')}
                  </CardTitle>
                  <CardDescription>
                    {step === 'phone' ? t('auth.loginSubtitle') : t('auth.codeSentTo', { phone })}
                  </CardDescription>
                </div>
              </div>
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
                  <div className="flex justify-center gap-2">
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
                        className="h-12 w-10 text-center text-lg"
                      />
                    ))}
                  </div>
                  {error && <ErrorBox message={error} />}
                  {devCode && (
                    <div className="rounded-md border border-us-border bg-us-surface px-3 py-2">
                      <p className="font-body text-sm text-us-ink-muted">
                        {t('auth.devCodeHint')}: <strong className="text-us-ink">{devCode}</strong>
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => void verifyOtp(code.join(''))}
                    disabled={loading || code.some((d) => !d)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('auth.checking')}
                      </>
                    ) : (
                      t('auth.loginButton')
                    )}
                  </Button>
                  <div className="text-center">
                    {resendCooldown > 0 ? (
                      <p className="text-sm text-us-ink-muted">
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
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setCode(['', '', '', '', '', '']);
                      setError('');
                    }}
                    className="w-full font-body text-sm text-us-ink-muted hover:text-us-accent"
                  >
                    {t('auth.changePhone')}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </PublicShell>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-us-danger/30 bg-red-50 px-3 py-2 font-body text-sm text-us-danger"
    >
      {message}
    </div>
  );
}
