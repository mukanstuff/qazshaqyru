import { Badge } from '@/components/ui/badge';

const labels: Record<string, string> = {
  pending: 'Ожидает',
  paid: 'Оплачен',
  cancelled: 'Отменён',
  refunded: 'Возврат',
};

const variantMap: Record<string, 'draft' | 'published' | 'outline' | 'archived'> = {
  pending: 'draft',
  paid: 'published',
  cancelled: 'outline',
  refunded: 'archived',
};

export function OrderStatusBadge({ status }: { status: string }) {
  const variant = variantMap[status] ?? 'outline';
  const label = labels[status] ?? status;

  return <Badge variant={variant}>{label}</Badge>;
}
