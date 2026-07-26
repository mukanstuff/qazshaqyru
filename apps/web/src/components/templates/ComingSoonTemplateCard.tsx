'use client';

import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import { PLAN_TIER_LABELS, type ComingSoonTemplate } from '@/lib/templates/coming-soon';
import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';

interface Props {
  template: ComingSoonTemplate;
}

export function ComingSoonTemplateCard({ template }: Props) {
  const { locale } = useI18n();
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const displayName = locale === 'kz' ? template.nameKz : template.nameRu;
  const eta = locale === 'kz' ? template.etaLabelKz : template.etaLabelRu;
  const tierLabel = PLAN_TIER_LABELS[locale === 'kz' ? 'kz' : 'ru'][template.planTier];
  const price =
    template.planTier === 'free'
      ? tierLabel
      : `${PLAN_CATALOG[template.planTier].priceKzt.toLocaleString(locale === 'kz' ? 'kk-KZ' : 'ru-RU')} ₸`;

  const submit = async () => {
    const trimmed = phone.replace(/\D/g, '');
    if (trimmed.length < 10) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/templates/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: template.slug, phone: trimmed }),
      });
      if (!res.ok) throw new Error('fail');
      setStatus('done');
      setPhone('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <article
      className="flex flex-col overflow-hidden rounded-2xl border border-dashed border-us-accent/20 bg-us-ivory/50"
      data-testid={`coming-soon-${template.slug}`}
    >
      <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 bg-gradient-to-b from-us-accent/5 to-us-cream/80 p-6 text-center">
        <div className="flex flex-wrap justify-center gap-1.5">
          <span className="rounded-full bg-us-gold/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            {eta}
          </span>
          <span className="rounded-full border border-us-accent/20 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-us-ink-muted">
            {locale === 'kz' ? 'Сайт' : 'Сайт'}
          </span>
        </div>
        <h3 className="font-display text-xl text-us-ink">{displayName}</h3>
        <p className="text-xs text-us-ink-muted">{price}</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-us-accent/10 bg-white/80 px-2 py-0.5 text-[10px] text-us-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-us-accent/10 p-4">
        {status === 'done' ? (
          <p className="text-center text-sm text-us-accent">
            {locale === 'kz' ? 'Қабылданды! Дайын болғанда хабарлаймыз.' : 'Принято! Сообщим, когда шаблон будет готов.'}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-us-ink-muted">
              {locale === 'kz'
                ? 'Дайын болғанда WhatsApp арқылы хабарлау'
                : 'Уведомим в WhatsApp, когда шаблон будет готов'}
            </p>
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder="+7 700 000 00 00"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className="h-9 text-sm"
                aria-label={locale === 'kz' ? 'Телефон' : 'Телефон'}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={status === 'loading'}
                onClick={() => void submit()}
              >
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </Button>
            </div>
            {status === 'error' ? (
              <p className="text-xs text-us-danger">
                {locale === 'kz' ? 'Телефон нөмірін тексеріңіз' : 'Проверьте номер телефона'}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
