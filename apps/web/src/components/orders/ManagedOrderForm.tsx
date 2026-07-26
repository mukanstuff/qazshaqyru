'use client';

import { useState } from 'react';
import { Loader2, MessageCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaptchaWidget } from '@/components/shared/CaptchaWidget';
import { useI18n } from '@/i18n';
import { isCaptchaRequiredOnClient } from '@/lib/shared/captcha-client';
import { getPublicWhatsappNumber, getWhatsappHref } from '@/lib/site/legal-config';
import { cn } from '@/lib/shared/utils';

interface ManagedOrderFormProps {
  templateId: string;
  templateName: string;
  managedPrice: number;
}

export function ManagedOrderForm({ templateId, templateName, managedPrice }: ManagedOrderFormProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRequired = isCaptchaRequiredOnClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const customerName = (formData.get('customerName') as string)?.trim();
    const customerPhone = (formData.get('customerPhone') as string)?.trim();
    const eventDate = (formData.get('eventDate') as string)?.trim() || undefined;
    const notes = (formData.get('notes') as string)?.trim() || undefined;
    const website = (formData.get('website') as string) || undefined;

    if (captchaRequired && !captchaToken) {
      setError(t('public.captcha.required'));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/orders/managed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          customerName,
          customerPhone,
          eventDate,
          notes,
          website,
          captchaToken: captchaToken ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t('common.error'));
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-us-success/10 text-us-success">
          <Check className="h-7 w-7" />
        </div>
        <h3 className="font-display text-xl font-medium text-us-ink">
          {t('managedOrder.successTitle')}
        </h3>
        <p className="mt-2 font-body text-sm text-us-ink-muted">{t('managedOrder.successDesc')}</p>
        {getPublicWhatsappNumber() ? (
            <Button variant="default" className="mt-6" asChild>
              <a
                href={getWhatsappHref(
                  t('managedOrder.whatsAppFollowUp').replace('{templateName}', templateName),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                {t('managedOrder.writeWhatsApp')}
              </a>
            </Button>
          ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="managed-customer-name">{t('managedOrder.nameLabel')}</Label>
        <Input
          id="managed-customer-name"
          name="customerName"
          required
          minLength={2}
          maxLength={100}
          placeholder={t('managedOrder.namePlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="managed-customer-phone">{t('managedOrder.phoneLabel')}</Label>
        <Input
          id="managed-customer-phone"
          name="customerPhone"
          type="tel"
          required
          minLength={10}
          maxLength={20}
          placeholder={t('managedOrder.phonePlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="managed-event-date">
          {t('managedOrder.eventDateLabel')}{' '}
          <span className="font-normal text-us-ink-muted">({t('common.optional')})</span>
        </Label>
        <Input id="managed-event-date" name="eventDate" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="managed-notes">
          {t('managedOrder.notesLabel')}{' '}
          <span className="font-normal text-us-ink-muted">({t('common.optional')})</span>
        </Label>
        <textarea
          id="managed-notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder={t('managedOrder.notesPlaceholder')}
          className={cn(
            'flex w-full rounded-md border border-us-border bg-us-surface px-3 py-2 font-body text-sm',
            'placeholder:text-us-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-us-accent focus-visible:ring-offset-2'
          )}
        />
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="sr-only"
        aria-hidden="true"
      />

      <CaptchaWidget onTokenChange={setCaptchaToken} />

      {error && (
        <div
          role="alert"
          className="rounded-md border border-us-danger/30 bg-red-50 px-3 py-2 font-body text-sm text-us-danger"
        >
          {error}
        </div>
      )}

      <Button type="submit" variant="default" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
        {loading ? t('common.loading') : t('managedOrder.submit')}
      </Button>

      <p className="text-center font-body text-xs text-us-ink-muted">
        {t('managedOrder.terms')}
        {managedPrice > 0 && (
          <span className="mt-1 block font-medium text-us-accent">
            {managedPrice.toLocaleString('ru-RU')} ₸
          </span>
        )}
      </p>
    </form>
  );
}
