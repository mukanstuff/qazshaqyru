'use client';

import { useI18n } from '@/i18n';
import type { SectionProps } from './types';

export function RsvpSection({ ctx }: SectionProps) {
  const { t } = useI18n();
  const isKz = ctx.invitation.language === 'kz';

  if (!ctx.canRSVP) return null;

  return (
    <section className="inv-section inv-manifest-rsvp" data-section="rsvp">
      <div className="inv-section__inner" style={{ textAlign: 'center' }}>
        <p className="inv-label">{t('public.sections.rsvpCtaTitle')}</p>
        <p className="inv-body">
          {isKz
            ? 'Тойға келуіңізді растауыңызды сұраймыз'
            : t('public.sections.rsvpCtaSubtitle')}
        </p>
        <button type="button" className="inv-btn-rsvp-link" onClick={ctx.onOpenRSVP}>
          {t('public.sections.rsvpCtaButton')}
        </button>
      </div>
    </section>
  );
}
