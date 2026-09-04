import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getCurrentSession } from '@/lib/shared/api';
import { PublicShell } from '@/components/shared/PublicShell';
import { AgencyPlanCard } from '@/components/dashboard/AgencyPlanCard';
import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';
import { resolveEntitlements, type LegacyPlanSku, type PlanSku } from '@/lib/entitlements';
import prisma from '@/lib/shared/db';
import { Button } from '@/components/ui/button';
import { getWhatsappHref } from '@/lib/site/legal-config';
import { getI18n } from '@/i18n/server';
import { buildLanguageAlternates, seoLocaleFromHeaders } from '@/lib/seo/hreflang';
import { formatKzt } from '@/lib/shared/format-price';

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, headerStore] = await Promise.all([getI18n(), headers()]);
  const urlLocale = seoLocaleFromHeaders((n) => headerStore.get(n));
  return {
    title: t('site.meta.agency'),
    description: t('site.meta.agencyDescription'),
    alternates: buildLanguageAlternates('/agency', urlLocale),
  };
}

export default async function AgencyPage() {
  const [session, { t, locale }] = await Promise.all([getCurrentSession(), getI18n()]);
  let hasActiveAgency = false;
  let agencyExpiresAt: string | null = null;

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { planSku: true, planExpiresAt: true },
    });
    const entitlements = resolveEntitlements({
      now: new Date(),
      user: {
        planSku: (user?.planSku as PlanSku | LegacyPlanSku | null) ?? null,
        planExpiresAt: user?.planExpiresAt ?? null,
      },
    });
    hasActiveAgency = entitlements.source === 'user' && entitlements.planSku === 'agency';
    agencyExpiresAt = user?.planExpiresAt?.toISOString() ?? null;
  }

  const price = formatKzt(PLAN_CATALOG.agency.priceKzt);

  return (
    <PublicShell isLoggedIn={Boolean(session)}>
      <div className="us-container max-w-3xl space-y-8 py-12">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-us-ink-muted">
            {t('agencyPage.eyebrow')}
          </p>
          <h1 className="font-display text-4xl text-us-ink md:text-5xl">{t('agencyPage.title')}</h1>
          <p className="mt-4 font-body text-base leading-relaxed text-us-ink-muted">
            {t('agencyPage.subtitle', { price })}
          </p>
        </div>

        <ul className="space-y-2 font-body text-sm text-us-ink">
          {(['benefit1', 'benefit2', 'benefit3', 'benefit4'] as const).map((key) => (
            <li key={key}>— {t(`agencyPage.${key}`)}</li>
          ))}
        </ul>

        {session ? (
          <AgencyPlanCard hasActiveAgency={hasActiveAgency} agencyExpiresAt={agencyExpiresAt} />
        ) : (
          /*
           * A signed-out visitor used to get WhatsApp and a link to /pricing and
           * nothing else — the one page selling the agency plan had no way to
           * actually buy it unless you happened to already be logged in. Sign-in
           * comes back here, where the real checkout card is waiting.
           */
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/login?redirect=${encodeURIComponent('/agency')}`}>
                {t('agencyPage.loginToSubscribe')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={getWhatsappHref(t('agencyPage.whatsappMessage'))}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('agencyPage.whatsapp')}
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/pricing">{t('agencyPage.comparePlans')}</Link>
            </Button>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
