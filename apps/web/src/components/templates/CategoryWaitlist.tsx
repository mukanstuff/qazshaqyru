'use client';

import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Waitlist for a category that has no templates yet.
 *
 * An empty category page is the one page on the site that is guaranteed to
 * disappoint: search sends someone looking for a беташар invitation and the
 * shelf is bare. Bouncing them to the full catalogue wastes the visit twice
 * over — they do not get what they came for, and we learn nothing. A phone
 * number turns the only thing an empty page is good for, a demand signal, into
 * a queue and into evidence about which category to build first.
 *
 * Written inline rather than reusing the landing's version: that one is a modal
 * welded into `LandingCelebrations` with its own open/close state, and pulling
 * it apart for a second caller is a bigger change than the twenty lines of form
 * it would save.
 */

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) return `+7${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 11) return `+${digits}`;
  return raw.trim().startsWith('+') ? `+${digits}` : digits ? `+${digits}` : '';
}

function isValidPhone(raw: string): boolean {
  return /^\+7\d{10}$/.test(normalizePhone(raw));
}

interface Props {
  /** Catalogue route slug, e.g. `betashar`. */
  categorySlug: string;
  locale: 'ru' | 'kz';
}

const COPY = {
  ru: {
    title: 'Этот раздел ещё готовим',
    body: 'Оставьте номер — напишем в WhatsApp, как только появятся первые шаблоны. Никакой рассылки, одно сообщение.',
    placeholder: '+7 (___) ___ __ __',
    submit: 'Сообщить мне',
    sending: 'Отправляем…',
    okTitle: 'Записали',
    okBody: 'Напишем, как только раздел откроется.',
    invalid: 'Проверьте номер — нужен казахстанский, начиная с +7',
    failed: 'Не получилось отправить. Попробуйте ещё раз.',
  },
  kz: {
    title: 'Бұл бөлім әзірленуде',
    body: 'Нөміріңізді қалдырыңыз — алғашқы үлгілер шыққанда WhatsApp арқылы хабарлаймыз. Тарату жоқ, бір ғана хабарлама.',
    placeholder: '+7 (___) ___ __ __',
    submit: 'Хабарлаңыздар',
    sending: 'Жіберілуде…',
    okTitle: 'Жазып алдық',
    okBody: 'Бөлім ашылған сәтте хабарлаймыз.',
    invalid: 'Нөмірді тексеріңіз — +7-ден басталатын қазақстандық нөмір керек',
    failed: 'Жіберу мүмкін болмады. Қайталап көріңіз.',
  },
} as const;

export function CategoryWaitlist({ categorySlug, locale }: Props) {
  const t = COPY[locale];
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'busy') return;
    if (!isValidPhone(phone)) {
      setStatus('err');
      setError(t.invalid);
      return;
    }
    setStatus('busy');
    setError('');
    try {
      const res = await fetch('/api/templates/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The API keys category signups apart from named coming-soon templates.
        body: JSON.stringify({ slug: `category:${categorySlug}`, phone: normalizePhone(phone) }),
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('ok');
    } catch {
      setStatus('err');
      setError(t.failed);
    }
  };

  if (status === 'ok') {
    return (
      <div className="mx-auto mt-8 max-w-sm rounded-3xl border border-us-accent/20 bg-white/70 p-6 text-center">
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-us-accent/10 text-us-accent">
          <Check className="h-5 w-5" />
        </span>
        <p className="font-display text-xl text-us-ink">{t.okTitle}</p>
        <p className="mt-1 font-body text-sm text-us-ink-muted">{t.okBody}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 max-w-sm rounded-3xl border border-us-accent/20 bg-white/70 p-6 text-center"
    >
      <p className="font-display text-xl text-us-ink">{t.title}</p>
      <p className="mt-2 font-body text-sm leading-relaxed text-us-ink-muted">{t.body}</p>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          if (status === 'err') setStatus('idle');
        }}
        placeholder={t.placeholder}
        aria-label={t.placeholder}
        aria-invalid={status === 'err'}
        className="mt-4 w-full rounded-full border border-us-border bg-white px-4 py-3 text-center font-body text-base text-us-ink outline-none focus:border-us-accent"
      />
      {status === 'err' && error ? (
        <p className="mt-2 font-body text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="mt-3 w-full" disabled={status === 'busy'}>
        {status === 'busy' ? t.sending : t.submit}
      </Button>
    </form>
  );
}
