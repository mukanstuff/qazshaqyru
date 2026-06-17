const styles = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-stone-100 text-stone-600 border-stone-200',
};

const labels = {
  draft: 'Черновик',
  published: 'Опубликовано',
  archived: 'В архиве',
};

export function StatusBadge({ status, t }: { status: 'draft' | 'published' | 'archived'; t?: (k: string) => string }) {
  const label = t ? t(`dashboard.status.${status}`) : labels[status];
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-medium ${styles[status]}`}>
      {label}
    </span>
  );
}
