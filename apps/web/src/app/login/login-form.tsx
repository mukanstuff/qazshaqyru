'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Heart, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useToast } from '@/components/ui/toaster';

interface Props {
  redirectTo: string;
}

export default function LoginForm({ redirectTo }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка отправки');
      }

      sessionStorage.setItem('login_phone', phone);
      router.push(`/verify?redirect=${encodeURIComponent(redirectTo)}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка';
      setError(msg);
      toast({ title: 'Не удалось отправить код', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-stone-50">
      <header className="px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
          <span className="font-serif text-lg text-stone-800">Invito</span>
        </Link>
        <LanguageSwitcher />
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />
            На главную
          </Link>

          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-5">
              <Phone className="w-5 h-5 text-rose-500" />
            </div>
            <h1 className="font-serif text-2xl text-stone-800 mb-2">Вход</h1>
            <p className="text-sm text-stone-500 mb-6">Введите номер телефона для авторизации</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
                  Телефон
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (700) 123-45-67"
                  autoComplete="tel"
                  autoFocus
                  inputMode="tel"
                  required
                  className="h-12 text-base"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-2.5 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length < 11}
                className="w-full h-12 rounded-xl text-base"
                style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Получить код'
                )}
              </Button>

              <p className="text-xs text-stone-400 text-center pt-2">
                Продолжая, вы соглашаетесь с{' '}
                <Link href="/terms" className="underline hover:text-stone-600">
                  условиями
                </Link>{' '}
                и{' '}
                <Link href="/privacy" className="underline hover:text-stone-600">
                  политикой конфиденциальности
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
