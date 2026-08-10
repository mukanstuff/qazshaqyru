import Link from 'next/link';
import { PencilLine } from 'lucide-react';

interface Props {
  href: string;
  title: string;
  label?: string;
}

export function PreviewFloatingEdit({ href, title, label = 'Редактировать шаблон' }: Props) {
  return (
    <Link
      href={href}
      aria-label={`${label}: ${title}`}
      className="inline-flex items-center gap-2 rounded-full bg-us-cta px-6 py-3 text-sm font-semibold text-white shadow-us-lg transition hover:bg-us-cta-hover active:scale-[0.97]"
    >
      <PencilLine className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
