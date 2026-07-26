import Link from 'next/link';
import { LogoMark } from '@/components/shared/ornaments';
import { PublicShell } from '@/components/shared/PublicShell';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <PublicShell>
      <div className="us-container relative flex min-h-[62vh] flex-col items-center justify-center overflow-hidden py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--us-accent)_12%,transparent),transparent_55%)]"
        />
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-us-accent/15 bg-us-cream shadow-sm">
          <LogoMark size={40} color="var(--us-accent)" />
        </div>
        <p className="font-display text-7xl leading-none text-us-accent/15">404</p>
        <div
          aria-hidden
          className="my-5 flex items-center gap-3 text-us-accent/40"
        >
          <span className="h-px w-12 bg-current" />
          <span className="block h-1.5 w-1.5 rotate-45 bg-current" />
          <span className="h-px w-12 bg-current" />
        </div>
        <h1 className="font-display text-3xl text-us-ink md:text-4xl">Страница не найдена</h1>
        <p className="mt-3 max-w-sm font-body text-sm leading-relaxed text-us-ink-muted">
          Запрашиваемая страница не существует или была перемещена
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <Button variant="default" asChild>
            <Link href="/">На главную</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/templates">К шаблонам</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
