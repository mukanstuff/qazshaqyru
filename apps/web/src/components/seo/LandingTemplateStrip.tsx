import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { LocaleLink } from '@/components/seo/LocaleLink';

interface Props {
  heading: string;
  /** Shown when the designs on display are not from this landing's own category. */
  note?: string | null;
  allHref: string;
  allLabel: string;
  children: ReactNode;
}

/**
 * The band of real designs on an SEO landing page.
 *
 * It deliberately breaks out of the article's `max-w-3xl` prose column: the
 * whole point is that after several screens of grey paragraphs the reader hits
 * something that is not text. Two cards per row on a phone, four on a desktop —
 * the same grid the catalogue uses, so a design is the same size wherever a
 * visitor meets it.
 */
export function LandingTemplateStrip({ heading, note, allHref, allLabel, children }: Props) {
  return (
    <section className="-mx-4 rounded-[1.75rem] border border-black/[0.06] bg-white px-4 py-7 shadow-sm sm:mx-0 sm:px-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-us-ink md:text-3xl">{heading}</h2>
          {note ? (
            <p className="mt-2 max-w-md font-body text-sm text-us-ink-muted">{note}</p>
          ) : null}
        </div>
        <LocaleLink
          href={allHref}
          className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-us-accent hover:underline"
        >
          {allLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </LocaleLink>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>
    </section>
  );
}
