import { headers } from 'next/headers';
import { LegalPageShell, LegalSection, legalProse } from '@/components/legal/LegalPageShell';
import { getLegalMeta, PrivacyBody } from '@/content/legal/bodies';
import { getI18n } from '@/i18n/server';
import { getCurrentSession } from '@/lib/shared/api';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';

export async function generateMetadata() {
  const [{ t }, headerStore] = await Promise.all([getI18n(), headers()]);
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: t('site.meta.privacy'),
    description: t('site.meta.privacyDescription'),
    alternates: buildLanguageAlternates('/privacy', urlLocale),
  };
}

export default async function PrivacyPage() {
  const [{ locale, t }, session] = await Promise.all([getI18n(), getCurrentSession()]);
  const meta = getLegalMeta(locale);
  const effectivePrefix = locale === 'kz' ? 'Күшіне енеді:' : 'Действует с';

  return (
    <LegalPageShell
      overline={meta.overline}
      title={t('site.legal.privacyTitle')}
      effectiveNote={`${effectivePrefix} ${meta.effective}`}
      isLoggedIn={Boolean(session)}
    >
      <LegalSection title={t('site.legal.operatorTitle')}>
        <p>{meta.operatorLine}</p>
      </LegalSection>
      <section className={legalProse.proseSection}>
        <PrivacyBody locale={locale} />
      </section>
    </LegalPageShell>
  );
}
