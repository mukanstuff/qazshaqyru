import { headers } from 'next/headers';
import { LegalPageShell, LegalSection, legalProse } from '@/components/legal/LegalPageShell';
import { getLegalMeta, RefundBody } from '@/content/legal/bodies';
import { getI18n } from '@/i18n/server';
import { getCurrentSession } from '@/lib/shared/api';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';

export async function generateMetadata() {
  const [{ t }, headerStore] = await Promise.all([getI18n(), headers()]);
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: t('site.meta.refund'),
    description: t('site.meta.refundDescription'),
    alternates: buildLanguageAlternates('/refund', urlLocale),
  };
}

export default async function RefundPage() {
  const [{ locale, t }, session] = await Promise.all([getI18n(), getCurrentSession()]);
  const meta = getLegalMeta(locale);
  const effectivePrefix = locale === 'kz' ? 'Күшіне енеді:' : 'Действует с';

  return (
    <LegalPageShell
      overline={meta.overline}
      title={t('site.legal.refundTitle')}
      effectiveNote={`${effectivePrefix} ${meta.effective}`}
      isLoggedIn={Boolean(session)}
    >
      <LegalSection title={t('site.legal.operatorTitle')}>
        <p>{meta.operatorLine}</p>
      </LegalSection>
      <section className={legalProse.proseSection}>
        <RefundBody locale={locale} />
      </section>
    </LegalPageShell>
  );
}
