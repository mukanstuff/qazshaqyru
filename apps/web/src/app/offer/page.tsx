import { LegalPageShell, LegalSection, legalProse } from '@/components/legal/LegalPageShell';
import { getLegalMeta, OfferBody } from '@/content/legal/bodies';
import { getI18n } from '@/i18n/server';
import { getCurrentSession } from '@/lib/shared/api';

export const metadata = {
  title: 'Публичная оферта — QazShaqyru',
  description: 'Публичная оферта на оказание цифровой услуги публикации приглашения.',
};

export default async function OfferPage() {
  const [{ locale, t }, session] = await Promise.all([getI18n(), getCurrentSession()]);
  const meta = getLegalMeta(locale);
  const effectivePrefix = locale === 'kz' ? 'Күшіне енеді:' : 'Действует с';

  return (
    <LegalPageShell
      overline={meta.overline}
      title={t('site.legal.offerTitle')}
      effectiveNote={`${effectivePrefix} ${meta.effective}`}
      isLoggedIn={Boolean(session)}
    >
      <LegalSection title={t('site.legal.operatorTitle')}>
        <p>{meta.operatorLine}</p>
      </LegalSection>
      <section className={legalProse.proseSection}>
        <OfferBody locale={locale} />
      </section>
    </LegalPageShell>
  );
}
