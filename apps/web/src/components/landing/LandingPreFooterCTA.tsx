'use client';

import { LocaleLink } from '@/components/seo/LocaleLink';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export function LandingPreFooterCTA() {
  const { t } = useI18n();

  return (
    <section className="bg-[var(--us-forest)] py-16 text-white sm:py-20">
      <div className="us-container text-center">
        <h2 className="us-display-l mb-4 text-balance">
          {t('landing.preFooter.title')}
        </h2>
        <p className="mx-auto mb-8 max-w-lg font-body text-white/75">
          {t('landing.preFooter.subtitle')}
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[var(--us-sage)] text-white hover:bg-white hover:text-[var(--us-forest)] focus-visible:ring-white"
        >
          <LocaleLink href="/invitations/edit">{t('landing.preFooter.cta')}</LocaleLink>
        </Button>
      </div>
    </section>
  );
}
