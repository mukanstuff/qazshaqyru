'use client';

import { Kundelik } from '@/components/shared/ornaments';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { SITE_LEGAL, getPublicWhatsappNumber } from '@/lib/site/legal-config';

type Props = {
  category: string;
  categoryLabel: string;
};

/**
 * Honest "coming soon" card — WhatsApp waitlist while templates are handmade.
 */
export function TemplateWaitlistCard({ category, categoryLabel }: Props) {
  const { t, locale } = useI18n();
  const phone =
    getPublicWhatsappNumber() || SITE_LEGAL.phoneTel.replace(/\D/g, '');
  const message =
    locale === 'kz'
      ? `Сәлеметсіз бе! «${categoryLabel}» үлгісі шыққанда хабарлаңыз (${category}).`
      : `Здравствуйте! Напишите, когда появится шаблон «${categoryLabel}» (${category}).`;
  const waHref = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <div
      className="flex flex-col justify-between rounded-2xl border border-dashed border-us-border bg-us-ivory/60 p-5"
      data-testid="template-waitlist-card"
      data-category={category}
    >
      <div>
        <span className="inline-flex rounded-full bg-us-gold/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          {t('templatesPage.comingSoon')}
        </span>
        <div className="mt-4 flex items-center gap-3">
          <Kundelik size={40} color="rgba(61,52,40,0.35)" strokeWidth={0.8} />
          <div>
            <h3 className="font-display text-xl text-us-ink">{categoryLabel}</h3>
            <p className="mt-1 font-body text-sm text-us-ink-muted">
              {t('templatesPage.waitlistHint')}
            </p>
          </div>
        </div>
      </div>

      <Button type="button" variant="outline" className="mt-5 w-full sm:w-auto" asChild>
        <a href={waHref} target="_blank" rel="noopener noreferrer">
          {t('templatesPage.waitlistCta')}
        </a>
      </Button>
    </div>
  );
}
