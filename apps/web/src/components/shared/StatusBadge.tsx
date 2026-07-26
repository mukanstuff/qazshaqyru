import { Badge } from '@/components/ui/badge';

const labels = {
  draft: 'Черновик',
  published: 'Опубликовано',
  archived: 'В архиве',
};

export function StatusBadge({
  status,
  t,
}: {
  status: 'draft' | 'published' | 'archived';
  t?: (k: string) => string;
}) {
  const label = t ? t(`dashboard.status.${status}`) : labels[status];
  return <Badge variant={status}>{label}</Badge>;
}
