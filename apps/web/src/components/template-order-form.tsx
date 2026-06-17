'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';

interface Props {
  template: {
    id: string;
    slug: string;
    priceKzt: number;
    nameRu: string;
  };
}

export function TemplateOrderForm({ template }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<'kaspi' | 'stripe'>('kaspi');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const customerName = (formData.get('customerName') as string)?.trim();
    const customerPhone = (formData.get('customerPhone') as string)?.trim();
    const eventDate = (formData.get('eventDate') as string)?.trim();
    const notes = (formData.get('notes') as string)?.trim() || undefined;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          provider,
          customerName,
          customerPhone,
          eventDate,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || t('orderForm.genericError'));
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      if (data.order?.status === 'paid') {
        toast({ title: t('orderForm.paidToast'), description: t('orderForm.paidRedirect') });
        router.push(`/invitations/${data.order.invitationId}`);
        return;
      }

      toast({
        title: t('orderForm.orderCreated'),
        description: t('orderForm.orderNumber', { id: data.order.id.slice(0, 8) }),
      });
      router.push('/dashboard?status=draft');
    } catch (err) {
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : t('orderForm.fallbackError'),
        variant: 'destructive',
      });
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
          {t('orderForm.nameLabel')}
        </label>
        <input
          name="customerName"
          required
          minLength={2}
          maxLength={100}
          placeholder={t('orderForm.namePlaceholder')}
          className="w-full h-11 px-4 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-stone-400"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
          {t('orderForm.phoneLabel')}
        </label>
        <input
          name="customerPhone"
          type="tel"
          required
          minLength={10}
          maxLength={20}
          placeholder={t('orderForm.phonePlaceholder')}
          className="w-full h-11 px-4 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-stone-400"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
          {t('orderForm.eventDateLabel')}
        </label>
        <input
          name="eventDate"
          type="date"
          required
          min={new Date().toISOString().split('T')[0]}
          className="w-full h-11 px-4 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-stone-400"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
          {t('orderForm.notesLabel')}
        </label>
        <textarea
          name="notes"
          rows={3}
          maxLength={500}
          placeholder={t('orderForm.notesPlaceholder')}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-stone-400 resize-none"
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-stone-500 mb-3">
          {t('orderForm.paymentMethod')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setProvider('kaspi')}
            className={`h-14 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
              provider === 'kaspi'
                ? 'border-rose-500 bg-rose-50'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-xs font-medium">{t('orderForm.providerKaspi')}</span>
          </button>
          <button
            type="button"
            onClick={() => setProvider('stripe')}
            className={`h-14 px-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
              provider === 'stripe'
                ? 'border-stone-900 bg-stone-50'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-medium">{t('orderForm.providerCard')}</span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #a78b4a 100%)' }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        {t('orderForm.pay', { amount: template.priceKzt.toLocaleString('ru-RU') })}
      </button>

      <p className="text-xs text-stone-400 text-center">{t('orderForm.terms')}</p>
    </form>
  );
}
