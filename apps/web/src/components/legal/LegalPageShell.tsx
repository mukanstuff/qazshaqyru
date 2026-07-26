import { PublicShell } from '@/components/shared/PublicShell';

const proseSection = 'space-y-3 font-body text-sm leading-relaxed text-us-ink-muted';
const proseHeading = 'font-display text-xl font-medium text-us-ink';
const proseList = 'list-disc space-y-2 pl-5';

export const legalProse = { proseSection, proseHeading, proseList } as const;

interface LegalPageShellProps {
  overline: string;
  title: string;
  children: React.ReactNode;
  effectiveNote?: string;
  isLoggedIn?: boolean;
}

export function LegalPageShell({
  overline,
  title,
  children,
  effectiveNote,
  isLoggedIn = false,
}: LegalPageShellProps) {
  return (
    <PublicShell isLoggedIn={isLoggedIn}>
      <div className="us-container max-w-3xl py-12 lg:py-16">
        <span className="us-overline">{overline}</span>
        <h1 className="us-display-l mt-3">{title}</h1>
        <div className="mt-10 space-y-8">{children}</div>
        {effectiveNote ? (
          <p className="mt-10 font-body text-xs text-us-ink-muted">{effectiveNote}</p>
        ) : null}
      </div>
    </PublicShell>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={proseSection}>
      <h2 className={proseHeading}>{title}</h2>
      {children}
    </section>
  );
}
