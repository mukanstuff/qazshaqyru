'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';

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

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      if (data.user) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 5 && newCode.every((d) => d)) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    } else {
      const nextEmpty = newCode.findIndex((d) => !d);
      if (nextEmpty !== -1) {
        inputRefs.current[nextEmpty]?.focus();
      }
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const verifyCode = codeToVerify || code.join('');
    if (verifyCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: verifyCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Неверный код');
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Произошла ошибка. Попробуйте позже.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendCooldown(60);
        if (data.devCode) {
          setDevCode(data.devCode);
        }
      } else {
        setError(data.message || 'Не удалось отправить код');
      }
    } catch {
      setError('Произошла ошибка');
    }
  };

  const formatPhone = (p: string) => {
    if (p.length < 4) return p;
    return `${p.slice(0, 2)} (${p.slice(2, 5)}) ${p.slice(5, 8)}-${p.slice(8, 10)}-${p.slice(10)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19L5 12L12 5"/>
          </svg>
          Назад
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Подтверждение</h1>
          <p className="text-muted-foreground">
            Код отправлен на номер<br />
            <span className="font-medium text-foreground">{formatPhone(phone)}</span>
          </p>
        </div>

        {/* Code inputs */}
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-bold"
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center mb-4">{error}</p>
        )}

        {devCode && (
          <div className="p-3 bg-muted rounded-lg text-center mb-4">
            <p className="text-sm font-mono">Тестовый код: {devCode}</p>
          </div>
        )}

        <Button
          onClick={() => handleVerify()}
          className="w-full h-12"
          disabled={loading || code.some((d) => !d)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Проверка...
            </>
          ) : (
            'Подтвердить'
          )}
        </Button>

        <div className="mt-6 text-center">
          {resendCooldown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Повторный запрос через {resendCooldown} сек.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-primary hover:underline"
            >
              Отправить код повторно
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
