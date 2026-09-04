'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

interface Props {
  orderId: string;
}

/** Manual Kaspi-transfer orders have no webhook — an admin checks the
 *  matching payment in the Kaspi Pay app by hand, then clicks this. */
export function OrderConfirmPaymentButton({ orderId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirm('Подтвердить оплату этого заказа? Приглашение откроется полностью.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm-payment`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Не удалось подтвердить оплату');
      toast({ title: 'Оплата подтверждена', description: 'Приглашение открыто' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось подтвердить',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="secondary" onClick={handleConfirm} disabled={loading}>
      {loading ? 'Подтверждаем…' : 'Подтвердить оплату'}
    </Button>
  );
}
