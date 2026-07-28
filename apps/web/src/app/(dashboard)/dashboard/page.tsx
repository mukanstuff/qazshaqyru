import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getCurrentSession } from '@/lib/shared/api';
import prisma from '@/lib/shared/db';
import { LogoMark } from '@/components/shared/ornaments';
import { PaymentPendingBanner } from '@/components/dashboard/PaymentPendingBanner';
import { InvitationRowActions } from '@/components/dashboard/InvitationRowActions';
import { AppHeader } from '@/components/shared/AppHeader';
import { GuestAnalyticsBar } from '@/components/dashboard/GuestAnalyticsBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgencyPlanCard } from '@/components/dashboard/AgencyPlanCard';
import { DashboardOpsStrip } from '@/components/dashboard/DashboardOpsStrip';
import { resolveEntitlements } from '@/lib/entitlements';
import { getI18n } from '@/i18n/server';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ payment?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { payment } = await searchParams;
  const showPaymentPending = payment === 'pending';
  const { locale, t } = await getI18n();

  const ctx = await getCurrentSession();
  if (!ctx) redirect('/login');

  const userPlan = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { planSku: true, planExpiresAt: true },
  });
  const entitlements = resolveEntitlements({
    now: new Date(),
    user: {
      planSku: (userPlan?.planSku as 'standard' | 'premium' | 'agency' | null) ?? null,
      planExpiresAt: userPlan?.planExpiresAt ?? null,
    },
  });

type DashboardInvitation = {
  id: string;
  slug: string;
  title: string;
  eventType: string;
  eventDate: Date;
  status: string;
  viewCount: number;
  unlockedPlanSku: string | null;
  _count?: { guests: number };
};

type DashboardGuestRow = {
  id?: string;
  invitationId: string;
  response?: { status: string } | null;
  hasPlusOne?: boolean;
};

  const invitations = (await prisma.invitation.findMany({
    where: { userId: ctx.user.id, status: { not: 'archived' } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      eventType: true,
      eventDate: true,
      status: true,
      viewCount: true,
      unlockedPlanSku: true,
      _count: { select: { guests: true } },
    },
  })) as unknown as DashboardInvitation[];

  const invitationIds = invitations.map((inv: DashboardInvitation) => inv.id);
  const guestRows =
    (invitationIds.length > 0
      ? await prisma.guest.findMany({
          where: { invitationId: { in: invitationIds } },
          select: {
            id: true,
            invitationId: true,
            hasPlusOne: true,
            response: { select: { status: true } },
          },
        })
      : []) as unknown as DashboardGuestRow[];

  const dateLocale = locale === 'kz' ? 'kk-KZ' : 'ru-RU';

  return (
    <div>
      <AppHeader />
      <div className="us-container space-y-8 pb-8 pt-24 lg:pb-12 lg:pt-28">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-us-ink">{t('dashboard.title')}</h1>
            <p className="mt-1 font-body text-us-ink-muted">{t('dashboard.subtitle')}</p>
          </div>
          <Button variant="default" className="min-h-11 shrink-0 px-5" asChild>
            <Link href="/templates">
              <Plus className="h-4 w-4" />
              {t('dashboard.createShort')}
            </Link>
          </Button>
        </div>

        <PaymentPendingBanner initialPending={showPaymentPending} alwaysPoll />

        {entitlements.source === 'user' && entitlements.planSku === 'agency' ? (
          <AgencyPlanCard
            hasActiveAgency
            agencyExpiresAt={userPlan?.planExpiresAt?.toISOString() ?? null}
          />
        ) : null}

        <DashboardOpsStrip
          hasPublished={invitations.some((inv: DashboardInvitation) => inv.status === 'published')}
        />

        {payment === 'invalid' && (
          <Card className="border-us-danger/30 bg-us-danger/5">
            <CardContent className="space-y-1 p-4">
              <p className="font-display font-medium text-us-danger">{t('dashboard.paymentInvalid.title')}</p>
              <p className="font-body text-sm text-us-ink-muted">{t('dashboard.paymentInvalid.description')}</p>
            </CardContent>
          </Card>
        )}

        {invitations.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <div className="space-y-4">
            {invitations.map((inv: DashboardInvitation) => {
              const date = new Date(inv.eventDate);
              const dateStr = date.toLocaleDateString(dateLocale, {
                day: 'numeric',
                month: 'long',
              });
              const guestTotal = inv._count?.guests ?? 0;
              const invGuestRows = guestRows.filter((row: DashboardGuestRow) => row.invitationId === inv.id);
              const invEntitlements = resolveEntitlements({
                now: new Date(),
                user: {
                  planSku: (userPlan?.planSku as 'standard' | 'premium' | 'agency' | null) ?? null,
                  planExpiresAt: userPlan?.planExpiresAt ?? null,
                },
                invitation: {
                  unlockedPlanSku:
                    (inv.unlockedPlanSku as 'standard' | 'premium' | 'agency' | null) ?? null,
                },
              });

              return (
                <Link key={inv.id} href={`/invitations/${inv.id}`} className="block">
                  <Card className="transition hover:border-us-accent/25 hover:shadow-us-md">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-2">
                          <h3 className="font-display text-lg font-medium text-us-ink">{inv.title}</h3>
                          <StatusBadge
                            status={inv.status as 'draft' | 'published' | 'archived'}
                            t={t}
                          />
                        </div>
                        <p className="mt-0.5 font-body text-sm text-us-ink-muted">{dateStr}</p>
                        {guestTotal > 0 && (
                          <GuestAnalyticsBar guestRows={invGuestRows} t={t} />
                        )}
                        {inv.status === 'published' && (
                          <p className="mt-1 text-sm text-us-ink-muted">
                            {t('dashboard.stats.views')}: {inv.viewCount}
                          </p>
                        )}
                      </div>
                      <InvitationRowActions
                        invitationId={inv.id}
                        slug={inv.slug}
                        status={inv.status}
                        restaurantLinkAllowed={invEntitlements.restaurantLink}
                      />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="us-glass grid gap-6 rounded-[2rem] border p-5 lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-us-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-us-accent">
          <LogoMark size={18} />
          {t('dashboard.empty.previewLabel')}
        </div>
        <h3 className="font-display text-2xl font-semibold text-us-ink">{t('dashboard.empty.title')}</h3>
        <p className="max-w-md font-body text-sm leading-relaxed text-us-ink-muted">
          {t('dashboard.empty.description')}
        </p>
        <Button variant="default" className="min-h-11 px-6" asChild>
          <Link href="/templates">
            <Plus className="h-4 w-4" />
            {t('dashboard.chooseTemplate')}
          </Link>
        </Button>
      </div>
      <div className="us-glass-soft rounded-[1.75rem] border p-4">
        <div className="us-glass rounded-[1.5rem] border p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-us-ink-muted">
                Той бөлмесі
              </p>
              <p className="mt-1 font-display text-2xl text-us-ink">RSVP · столы · рассылка</p>
            </div>
            <div className="flex gap-2 text-xs text-us-ink-muted">
              <span className="us-glass-soft rounded-full border px-3 py-1">24 RSVP</span>
              <span className="us-glass-soft rounded-full border px-3 py-1">18 мест</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="us-glass-soft rounded-2xl border p-3">
              <p className="text-xs text-us-ink-muted">Отправлено</p>
              <p className="mt-1 font-display text-2xl text-us-ink">128</p>
            </div>
            <div className="us-glass-soft rounded-2xl border p-3">
              <p className="text-xs text-us-ink-muted">Подтвердили</p>
              <p className="mt-1 font-display text-2xl text-us-ink">84%</p>
            </div>
            <div className="us-glass-soft rounded-2xl border p-3">
              <p className="text-xs text-us-ink-muted">WhatsApp</p>
              <p className="mt-1 font-display text-2xl text-us-accent">1 tap</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
