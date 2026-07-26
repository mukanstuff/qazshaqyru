import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentSession } from '@/lib/shared/api';
import { PublicShell } from '@/components/shared/PublicShell';
import { AgencyPlanCard } from '@/components/dashboard/AgencyPlanCard';
import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';
import { resolveEntitlements } from '@/lib/entitlements';
import prisma from '@/lib/shared/db';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Для тойхан и организаторов — QazShaqyru',
  description:
    '9 990 ₸/мес: безлимит приглашений, список гостей, рассадка, портал менеджеру тойханы. Инструмент партнёра, не marketplace.',
};

export default async function AgencyPage() {
  const session = await getCurrentSession();
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
        planSku: (user?.planSku as 'standard' | 'premium' | 'agency' | null) ?? null,
        planExpiresAt: user?.planExpiresAt ?? null,
      },
    });
    hasActiveAgency = entitlements.source === 'user' && entitlements.planSku === 'agency';
    agencyExpiresAt = user?.planExpiresAt?.toISOString() ?? null;
  }

  const price = PLAN_CATALOG.agency.priceKzt.toLocaleString('ru-RU');

  return (
    <PublicShell isLoggedIn={Boolean(session)}>
      <div className="us-container max-w-3xl space-y-8 py-12">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-us-ink-muted">
            Для партнёров
          </p>
          <h1 className="font-display text-4xl text-us-ink md:text-5xl">
            Для тойхан и организаторов
          </h1>
          <p className="mt-4 font-body text-base leading-relaxed text-us-ink-muted">
            {price} ₸/мес. Безлимит приглашений, ответы гостей, рассадка, список для зала и портал
            менеджеру. «Сделаем за вас» — после оплаты. Не клон toikhana.kz.
          </p>
        </div>

        <ul className="space-y-2 font-body text-sm text-us-ink">
          <li>— Безлимит сайт- и сүрет-приглашений на 30 дней</li>
          <li>— Список на тойхану: Excel-файл и ссылка-портал менеджеру</li>
          <li>— Рассадка и семьи для 150–300 гостей</li>
          <li>— Своя ссылка /i/… на каждом приглашении</li>
        </ul>

        {session ? (
          <AgencyPlanCard hasActiveAgency={hasActiveAgency} agencyExpiresAt={agencyExpiresAt} />
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent('/agency')}`}>
                Войти и оформить
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">Сравнить тарифы</Link>
            </Button>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
