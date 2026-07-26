'use client';

import { useI18n } from '@/i18n';
import { parseProgram } from '@/components/invitation-layouts/types';
import type { SectionProps } from './types';

export function ProgramSection({ ctx }: SectionProps) {
  const { t } = useI18n();
  const program = parseProgram(ctx.invitation.customText?.program);

  if (!program || program.length === 0) return null;

  return (
    <section className="inv-section inv-manifest-program" data-section="program">
      <div className="inv-section__inner">
        <p className="inv-section-label">{t('public.sections.program')}</p>
        <h2 className="inv-manifest-dress__title">{t('public.sections.programDay')}</h2>
        <div className="inv-program">
          <div className="inv-program__line" aria-hidden />
          {program.map((item, idx) => (
            <div key={`${item.time}-${idx}`} className="inv-program__item">
              <div className="inv-program__time">{item.time}</div>
              <div className="inv-program__title">{item.title}</div>
              {item.description ? (
                <div className="inv-program__desc">{item.description}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
