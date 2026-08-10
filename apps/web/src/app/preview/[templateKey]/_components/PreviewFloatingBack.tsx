import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  href: string;
  label?: string;
}

export function PreviewFloatingBack({ href, label = 'Назад' }: Props) {
  return (
    <Link
      href={href}
      className="us-chrome-pill--dark inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px active:scale-[0.97]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
