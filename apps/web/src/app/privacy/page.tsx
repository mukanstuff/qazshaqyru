import { LegalPageShell, LegalSection, legalProse } from '@/components/legal/LegalPageShell';
import { getLegalMeta, PrivacyBody } from '@/content/legal/bodies';
import { getI18n } from '@/i18n/server';
import { getCurrentSession } from '@/lib/shared/api';

export const metadata = {
  title: 'Политика конфиденциальности — QazShaqyru',
  description: 'Как QazShaqyru обрабатывает персональные данные пользователей и гостей.',
};

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
