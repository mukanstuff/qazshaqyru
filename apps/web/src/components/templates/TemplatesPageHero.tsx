import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface StatPill {
  value: string | number;
  label: string;
}

interface TemplatesPageHeroProps {
  /** Big hero (used by /templates/[category]). */
  overline: string;
  title: string;
  subtitle: string;
  stats: StatPill[];
}

interface CompactHeroProps {
  /** Compact breadcrumb-only hero (used by /templates). */
  variant: 'compact';
  eyebrow: string;
  breadcrumb: { label: string; href?: string }[];
  current: string;
  stats: StatPill[];
  rightSlot?: ReactNode;
}

type Props = TemplatesPageHeroProps | CompactHeroProps;

export function TemplatesPageHero(props: Props) {
  if ('variant' in props && props.variant === 'compact') {
    return <CompactHero {...props} />;
  }
  return <FullHero {...(props as TemplatesPageHeroProps)} />;
}

function FullHero({ overline, title, subtitle, stats }: TemplatesPageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-us-border/40 py-12 lg:py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--us-accent)_12%,transparent),transparent_55%)]"
        aria-hidden
      />
      <div className="us-container relative max-w-4xl space-y-5 text-center lg:mx-auto">
        <span className="us-overline text-us-accent">{overline}</span>
        <h1 className="font-display text-4xl leading-tight text-us-ink md:text-5xl lg:text-6xl">{title}</h1>
        <p className="mx-auto max-w-2xl font-body text-base text-us-ink-muted lg:text-lg">{subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="us-glass-strong inline-flex items-center gap-2 rounded-full border px-4 py-2"
            >
              <span className="font-display text-lg font-medium text-us-accent">{stat.value}</span>
              <span className="font-body text-sm text-us-ink-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompactHero({ eyebrow, breadcrumb, current, stats, rightSlot }: CompactHeroProps) {
  return (
    <section className="border-b border-us-border/60 bg-[#fcfcfb]">
      <div className="us-container flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body">
            {breadcrumb.map((item, idx) => (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
                {item.href ? (
                  <a
                    href={item.href}
                    className="rounded text-us-ink-muted transition-colors hover:text-us-ink"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-us-ink-muted">{item.label}</span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-us-ink-muted/60" aria-hidden />
              </li>
            ))}
            <li className="font-body font-medium text-us-ink">{current}</li>
          </ol>
          <span className="hidden text-us-ink-muted/40 md:inline">·</span>
          <span className="font-body text-xs uppercase tracking-widest text-us-accent">{eyebrow}</span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-us-border/70 bg-white px-3 py-1.5"
              >
                <span className="font-display text-base font-medium text-us-accent">{stat.value}</span>
                <span className="font-body text-xs text-us-ink-muted">{stat.label}</span>
              </div>
            ))}
          </div>
          {rightSlot}
        </div>
      </div>
    </section>
  );
}