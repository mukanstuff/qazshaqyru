import { LegalPageShell, LegalSection, legalProse } from '@/components/legal/LegalPageShell';
import { getLegalMeta, TermsBody } from '@/content/legal/bodies';
import { getI18n } from '@/i18n/server';
import { getCurrentSession } from '@/lib/shared/api';

export const metadata = {
  title: 'Условия использования — QazShaqyru',
  description: 'Условия использования сервиса цифровых приглашений QazShaqyru.',
};

export default async function TermsPage() {
  const [{ locale, t }, session] = await Promise.all([getI18n(), getCurrentSession()]);
  const meta = getLegalMeta(locale);
  const effectivePrefix = locale === 'kz' ? 'Күшіне енеді:' : 'Действует с';

  return (
    <LegalPageShell
      overline={meta.overline}
      title={t('site.legal.termsTitle')}
      effectiveNote={`${effectivePrefix} ${meta.effective}`}
      isLoggedIn={Boolean(session)}
    >
      <LegalSection title={t('site.legal.operatorTitle')}>
        <p>{meta.operatorLine}</p>
      </LegalSection>
      <section className={legalProse.proseSection}>
        <TermsBody locale={locale} />
      </section>
    </LegalPageShell>
  );
}
