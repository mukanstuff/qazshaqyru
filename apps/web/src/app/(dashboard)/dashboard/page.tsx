import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, ListChecks, UtensilsCrossed, Share2, Eye, Users } from 'lucide-react';
import { getCurrentSession } from '@/lib/shared/api';
import prisma from '@/lib/shared/db';
import { LogoMark } from '@/components/shared/ornaments';
import { PaymentPendingBanner } from '@/components/dashboard/PaymentPendingBanner';
import { InvitationRowActions } from '@/components/dashboard/InvitationRowActions';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { CabinetFooter } from '@/components/shared/CabinetFooter';
import { GuestAnalyticsBar } from '@/components/dashboard/GuestAnalyticsBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgencyPlanCard } from '@/components/dashboard/AgencyPlanCard';
import { DashboardListControls } from '@/components/dashboard/DashboardListControls';
import { parseDashboardFilter, parseDashboardSort } from '@/lib/dashboard/list-params';
import { resolveEntitlements, type LegacyPlanSku, type PlanSku } from '@/lib/entitlements';
import { computeGuestAnalytics } from '@/lib/guests/guest-analytics';
import { resolvePaidTemplateOrder, resolvePublicationPriceKzt } from '@/lib/invitations/invitation-pricing';
import { getI18n } from '@/i18n/server';

export const dynamic = 'force-dynamic';

/*
 * The cabinet's own tab title.
 *
 * None of the signed-in pages declared metadata, so the browser tab on
 * /dashboard, /settings and the hub all read the marketing title of the whole
 * site: "Той мен үйлену тойына онлайн шақыру — қонақ жауаптары мен отырғызу".
 * Three identical tabs, none of them naming the page. `noIndex` states what is
 * already true of a page behind a session.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t('dashboard.title'), robots: { index: false, follow: false } };
}

interface Props {
  searchParams: Promise<{ payment?: string; q?: string; sort?: string; filter?: string }>;
}

/**
 * How many invitations it takes before search and sort earn their place.
 *
 * Below this the controls are pure chrome: a search box above three cards is
 * slower than reading the three cards. Most customers have one wedding.
 */
const LIST_CONTROLS_THRESHOLD = 4;

type DashboardInvitation = {
  id: string;
  slug: string;
  title: string;
  eventType: string;
  eventDate: Date;
  status: string;
  viewCount: number;
  templateKey: string | null;
  unlockedPlanSku: string | null;
  template: { priceKzt: number; previewImageUrl: string | null } | null;
  orders: { amountKzt: number }[];
  _count?: { guests: number };
};

type DashboardGuestRow = {
  id?: string;
  invitationId: string;
  response?: { status: string } | null;
  hasPlusOne?: boolean;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { payment, q: rawQuery, sort: rawSort, filter: rawFilter } = await searchParams;
  const showPaymentPending = payment === 'pending';
  const { locale, t } = await getI18n();

  const ctx = await getCurrentSession();
  if (!ctx) redirect('/login');

  const userPlan = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { planSku: true, planExpiresAt: true },
  });

  // The user's plan is the same for every row, so this is resolved once here.
  // It used to be recomputed identically inside the render loop for each
  // invitation.
  const entitlements = resolveEntitlements({
    now: new Date(),
    user: {
      planSku: (userPlan?.planSku as PlanSku | LegacyPlanSku | null) ?? null,
      planExpiresAt: userPlan?.planExpiresAt ?? null,
    },
  });

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
      templateKey: true,
      unlockedPlanSku: true,
      template: { select: { priceKzt: true, previewImageUrl: true } },
      orders: { where: { status: 'paid', orderType: 'self' }, select: { amountKzt: true } },
      _count: { select: { guests: true } },
    },
  })) as unknown as DashboardInvitation[];

  const invitationIds = invitations.map((inv) => inv.id);
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

  const publishedCount = invitations.filter((inv) => inv.status === 'published').length;
  const draftCount = invitations.length - publishedCount;
  // computeGuestAnalytics, not a `status === 'attending'` filter: "attending"
  // is three separate statuses (plain / plus-one / no-children).
  const attendingCount = computeGuestAnalytics(guestRows).attending;

  /*
   * Search / filter / sort.
   *
   * Done here rather than in the Prisma query on purpose: one owner's list is
   * tens of rows, they are already loaded for the summary counts above, and
   * "по названию" has to collate Kazakh and Russian letters — which Postgres
   * would do under whatever collation the database happens to have, and
   * Intl.Collator does correctly.
   */
  const collator = new Intl.Collator(locale === 'kz' ? 'kk' : 'ru', { sensitivity: 'base' });
  const query = (rawQuery ?? '').trim().toLocaleLowerCase(dateLocale);
  const sort = parseDashboardSort(rawSort);
  const filter = parseDashboardFilter(rawFilter);

  const matchesQuery = (inv: DashboardInvitation) => {
    if (query === '') return true;
    const eventLabel = t(`events.${inv.eventType}`).toLocaleLowerCase(dateLocale);
    return (
      inv.title.toLocaleLowerCase(dateLocale).includes(query) || eventLabel.includes(query)
    );
  };

  const visibleInvitations = invitations
    .filter((inv) =>
      filter === 'all'
        ? true
        : filter === 'published'
          ? inv.status === 'published'
          : inv.status !== 'published'
    )
    .filter(matchesQuery);

  // 'new' is the query's own order (createdAt desc), so it needs no sort pass.
  if (sort === 'event') {
    visibleInvitations.sort((a, b) => +new Date(a.eventDate) - +new Date(b.eventDate));
  } else if (sort === 'guests') {
    visibleInvitations.sort((a, b) => (b._count?.guests ?? 0) - (a._count?.guests ?? 0));
  } else if (sort === 'name') {
    visibleInvitations.sort((a, b) => collator.compare(a.title, b.title));
  }

  const showListControls = invitations.length >= LIST_CONTROLS_THRESHOLD;

  return (
    <div className="flex min-h-screen flex-col bg-us-ivory">
      <SiteHeader isLoggedIn />
      <main className="us-container flex-1 space-y-8 pb-8 pt-24 lg:pb-12 lg:pt-28">
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

        {/*
          Real counts from the rows already loaded above. This replaces a
          «Guest list & seating» strip whose only controls were a link to
          /pricing wearing a people icon and a non-interactive <span> shaped
          like a download button — it described per-invitation features as if
          they lived here, and offered neither.
        */}
        {/*
          Shown only once there is something to summarise. With a single draft
          the row read "приглашений 1 · опубликовано 0 · черновиков 1 ·
          подтвердили 0" — the same number twice and two zeroes, four boxes of
          chrome above a list of one. Most customers have exactly one wedding.
        */}
        {invitations.length > 1 || publishedCount > 0 ? (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <OverviewStat label={t('dashboard.overview.invitations')} value={invitations.length} />
            <OverviewStat label={t('dashboard.overview.published')} value={publishedCount} />
            <OverviewStat label={t('dashboard.overview.drafts')} value={draftCount} />
            <OverviewStat label={t('dashboard.overview.attending')} value={attendingCount} />
          </dl>
        ) : null}

        {payment === 'invalid' && (
          <Card className="border-us-danger/30 bg-us-danger/5">
            <CardContent className="space-y-1 p-4">
              <p className="font-display font-medium text-us-danger">{t('dashboard.paymentInvalid.title')}</p>
              <p className="font-body text-sm text-us-ink-muted">{t('dashboard.paymentInvalid.description')}</p>
            </CardContent>
          </Card>
        )}

        {showListControls ? (
          <DashboardListControls
            q={rawQuery ?? ''}
            sort={sort}
            filter={filter}
            shown={visibleInvitations.length}
            total={invitations.length}
          />
        ) : null}

        {invitations.length === 0 ? (
          <EmptyState t={t} />
        ) : visibleInvitations.length === 0 ? (
          <Card>
            <CardContent className="space-y-1 p-6 text-center">
              <p className="font-display text-lg text-us-ink">{t('dashboard.list.nothingFound')}</p>
              <p className="font-body text-sm text-us-ink-muted">
                {t('dashboard.list.nothingFoundHint')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleInvitations.map((inv) => {
              const date = new Date(inv.eventDate);
              // Year included. Invitations are routinely made months ahead —
              // "15 мая" alone does not say whether that is this year or next.
              const dateStr = date.toLocaleDateString(dateLocale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
              const guestTotal = inv._count?.guests ?? 0;
              const invGuestRows = guestRows.filter((row) => row.invitationId === inv.id);
              // Same rule as getInvitationPricing: sum every paid order against the
              // *current* template's price. Does not consult the invitation's sticky
              // `unlockedPlanSku` — see resolvePaidTemplateOrder for why.
              const invTotalPaidKzt = inv.orders.reduce((sum, o) => sum + o.amountKzt, 0);
              const invPriceKzt = resolvePublicationPriceKzt(inv.template?.priceKzt ?? null);
              const invFullAccess = resolvePaidTemplateOrder(invTotalPaidKzt, invPriceKzt);
              const hubHref = `/invitations/${inv.id}`;
              const editHref = inv.templateKey
                ? `/editor/${encodeURIComponent(inv.templateKey)}?id=${inv.id}`
                : hubHref;

              return (
                <Card key={inv.id} className="transition hover:border-us-accent/25 hover:shadow-us-md">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      {/* The hub shows the design; the list did not, so several
                          invitations were told apart by title alone. */}
                      {inv.template?.previewImageUrl ? (
                        // Visible on the phone too. The thumbnail was added
                        // because invitations were told apart by title alone,
                        // then hidden below `sm` — on the one device where
                        // every card is full width and two drafts of the same
                        // wedding look identical.
                        <div className="h-20 w-[3.75rem] shrink-0 overflow-hidden rounded-lg border border-us-border/60 bg-us-ivory">
                          <Image
                            src={inv.template.previewImageUrl}
                            alt=""
                            width={60}
                            height={80}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/*
                            The title is the link to the hub. The whole card used
                            to be one big <a>, which forced every nested action
                            link into invalid `<a>`-inside-`<a>` markup.
                          */}
                          <Link
                            href={hubHref}
                            className="font-display text-lg font-medium text-us-ink transition-colors hover:text-us-accent"
                          >
                            {inv.title}
                          </Link>
                          <StatusBadge
                            status={inv.status as 'draft' | 'published' | 'archived'}
                            t={t}
                          />
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-sm text-us-ink-muted">
                          <span>{dateStr}</span>
                          {guestTotal > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" aria-hidden />
                              {t('dashboard.guestsCount', { count: guestTotal })}
                            </span>
                          ) : null}
                          {inv.status === 'published' ? (
                            <span className="inline-flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" aria-hidden />
                              {inv.viewCount}
                            </span>
                          ) : null}
                        </p>
                        {guestTotal > 0 && <GuestAnalyticsBar guestRows={invGuestRows} t={t} />}
                      </div>

                      <Button variant="default" size="sm" className="min-h-11 shrink-0" asChild>
                        <Link href={hubHref}>{t('dashboard.manage')}</Link>
                      </Button>
                    </div>

                    <div className="border-t border-us-border/60 pt-3">
                      <InvitationRowActions
                        invitationId={inv.id}
                        slug={inv.slug}
                        status={inv.status}
                        editHref={editHref}
                        restaurantLinkAllowed={invFullAccess || entitlements.restaurantLink}
                        csvAllowed={invFullAccess || entitlements.csvExport}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <CabinetFooter />
    </div>
  );
}

function OverviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-us-border/70 bg-us-surface px-4 py-3">
      <dt className="font-body text-xs uppercase tracking-wide text-us-ink-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold text-us-ink">{value}</dd>
    </div>
  );
}

/**
 * First screen a brand-new account ever sees. Used to illustrate "what you
 * get" with fabricated numbers (24 RSVP, 84%, 128 sent) baked directly into
 * the markup — invented stats with zero backing data, shown before the
 * person has created anything. Replaced with the three real features
 * (funnel / restaurant CSV / WhatsApp share), whose copy already existed
 * translated in both locales (dashboard.empty.preview{Funnel,Csv,Share}) but
 * was never wired to any component.
 */
function EmptyState({ t }: { t: (key: string) => string }) {
  const features = [
    { icon: ListChecks, text: t('dashboard.empty.previewFunnel') },
    { icon: UtensilsCrossed, text: t('dashboard.empty.previewCsv') },
    { icon: Share2, text: t('dashboard.empty.previewShare') },
  ];

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
      <div className="us-glass-soft flex flex-col justify-center gap-3 rounded-[1.75rem] border p-5 sm:p-6">
        {features.map(({ icon: Icon, text }) => (
          <div key={text} className="us-glass flex items-center gap-3 rounded-2xl border p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-us-accent/10 text-us-accent">
              <Icon className="h-4 w-4" />
            </span>
            <p className="font-body text-sm text-us-ink">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
