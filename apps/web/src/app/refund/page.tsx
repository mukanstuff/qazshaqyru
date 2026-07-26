import { LegalPageShell, LegalSection, legalProse } from '@/components/legal/LegalPageShell';
import { getLegalMeta, RefundBody } from '@/content/legal/bodies';
import { getI18n } from '@/i18n/server';
import { getCurrentSession } from '@/lib/shared/api';

export const metadata = {
  title: 'Политика возврата — QazShaqyru',
  description: 'Условия возврата оплаты за цифровую услугу публикации приглашения QazShaqyru.',
};

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
