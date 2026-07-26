interface StatPill {
  value: string | number;
  label: string;
}

interface TemplatesPageHeroProps {
  overline: string;
  title: string;
  subtitle: string;
  stats: StatPill[];
}

export function TemplatesPageHero({ overline, title, subtitle, stats }: TemplatesPageHeroProps) {
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
