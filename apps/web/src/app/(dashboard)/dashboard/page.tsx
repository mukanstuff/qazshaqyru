import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Calendar, Users, Sparkles, Inbox, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { getCurrentSession } from '@/lib/api';
import { getI18n } from '@/i18n/server';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogoutButton } from '@/components/logout-button';
import { StatusBadge } from '@/components/status-badge';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

interface Props {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ctx = await getCurrentSession();
  if (!ctx) redirect('/login');

  const { t } = await getI18n();
  const page = Math.max(1, parseInt(sp.page || '1', 10));
  const q = (sp.q || '').trim();
  const status = sp.status || 'all';

  const statusFilter: { status?: 'draft' | 'published' | 'archived' } = {};
  if (status === 'draft' || status === 'published' || status === 'archived') {
    statusFilter.status = status;
  }

  const where = {
    userId: ctx.user.id,
    ...statusFilter,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { slug: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  // Single round-trip for stats: we aggregate status, guest count, and
  // confirmed responses all in parallel. Previously this fired 5+
  // separate count() queries against the DB.
  const [invitations, total, statusGroups, paidOrdersPending, guestAgg, confirmedAgg] =
    await Promise.all([
      prisma.invitation.findMany({
        where,
        include: {
          _count: { select: { guests: true, orders: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.invitation.count({ where }),
      prisma.invitation.groupBy({
        by: ['status'],
        where: { userId: ctx.user.id },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where: {
          userId: ctx.user.id,
          status: 'paid',
          invitationId: null,
        },
        orderBy: { paidAt: 'desc' },
        take: 1,
        select: { id: true, paidAt: true },
      }),
      prisma.guest.count({ where: { invitation: { userId: ctx.user.id } } }),
      prisma.guestResponse.count({
        where: {
          guest: { invitation: { userId: ctx.user.id } },
          status: { in: ['attending', 'attending_plus_one'] },
        },
      }),
    ]);

  const totalCount = statusGroups.reduce((sum, g) => sum + g._count._all, 0);
  const published = statusGroups.find((g) => g.status === 'published')?._count._all ?? 0;
  const drafts = statusGroups.find((g) => g.status === 'draft')?._count._all ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paidOrder = paidOrdersPending[0] ?? null;

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-40 backdrop-blur bg-white/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-rose-400">♥</span>
            <span className="font-serif text-lg tracking-tight text-stone-800">Invito</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="text-sm text-stone-500 hidden sm:inline">
              {ctx.user.phone}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-stone-800">{t('dashboard.title')}</h1>
            <p className="text-stone-500 mt-1">{t('dashboard.subtitle')}</p>
          </div>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)' }}
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.create')}
          </Link>
        </div>

        {paidOrder && (
          <div
            role="status"
            className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <PartyPopper className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-emerald-900">
                  {t('dashboard.paidOrderBanner.title')}
                </p>
                <p className="text-sm text-emerald-800/80">
                  {t('dashboard.paidOrderBanner.description', {
                    id: paidOrder.id.slice(0, 8),
                  })}
                </p>
              </div>
            </div>
            <Link
              href={`/api/orders/${paidOrder.id}/success`}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 shrink-0"
            >
              {t('dashboard.paidOrderBanner.action')}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label={t('dashboard.stats.total')} value={totalCount} />
          <StatCard label={t('dashboard.stats.published')} value={published} accent="emerald" />
          <StatCard label={t('dashboard.stats.drafts')} value={drafts} accent="amber" />
          <StatCard
            label={t('dashboard.stats.confirmed')}
            value={confirmedAgg}
            suffix={` / ${guestAgg}`}
            accent="rose"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form className="flex-1 flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t('dashboard.search')}
              className="flex-1 h-11 px-4 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:border-stone-400"
            />
            <input type="hidden" name="status" value={status} />
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
            >
              {t('dashboard.searchButton')}
            </button>
          </form>
          <div className="flex gap-2">
            {[
              { value: 'all', label: t('dashboard.filterAll') },
              { value: 'published', label: t('dashboard.status.published') },
              { value: 'draft', label: t('dashboard.status.draft') },
              { value: 'archived', label: t('dashboard.status.archived') },
            ].map((f) => (
              <Link
                key={f.value}
                href={`/dashboard?status=${f.value}${q ? `&q=${q}` : ''}`}
                className={`h-11 px-4 inline-flex items-center rounded-xl text-sm font-medium transition-colors ${
                  status === f.value
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {invitations.length === 0 ? (
          <EmptyState q={q} status={status} t={t} />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {invitations.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  t={t}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Link
                  href={`/dashboard?page=${Math.max(1, page - 1)}${q ? `&q=${q}` : ''}&status=${status}`}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border border-stone-200 ${
                    page === 1 ? 'pointer-events-none opacity-30' : 'hover:bg-white'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <span className="text-sm text-stone-500 px-4">
                  {page} / {totalPages}
                </span>
                <Link
                  href={`/dashboard?page=${Math.min(totalPages, page + 1)}${q ? `&q=${q}` : ''}&status=${status}`}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border border-stone-200 ${
                    page === totalPages ? 'pointer-events-none opacity-30' : 'hover:bg-white'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent = 'stone',
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: 'stone' | 'emerald' | 'amber' | 'rose';
}) {
  const colors: Record<string, string> = {
    stone: 'text-stone-700',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-100">
      <p className="text-xs uppercase tracking-wider text-stone-400 mb-2">{label}</p>
      <p className={`text-2xl font-light ${colors[accent]}`}>
        {value}
        {suffix && <span className="text-sm text-stone-400 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function InvitationCard({ invitation, t }: { invitation: any; t: (k: string) => string }) {
  const eventDate = new Date(invitation.eventDate);
  const eventLabel = t(`invitation.eventType.${invitation.eventType}` as any);

  return (
    <Link
      href={`/invitations/${invitation.id}`}
      className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-stone-200 hover:shadow-lg transition-all"
    >
      <div className="aspect-[4/3] relative bg-gradient-to-br from-stone-100 to-stone-200 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Calendar className="w-12 h-12 text-stone-300" />
        </div>
        <div className="absolute top-3 left-3">
          <StatusBadge status={invitation.status} t={t} />
        </div>
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-stone-700">
          {eventDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-wider text-stone-400 mb-2">{eventLabel}</p>
        <h3 className="font-medium text-stone-800 group-hover:text-stone-900 mb-3 line-clamp-1">
          {invitation.title}
        </h3>
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {invitation._count.guests}
          </span>
          <span className="flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5" />
            {new Date(invitation.createdAt).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ q, status, t }: { q: string; status: string; t: (k: string) => string }) {
  if (q || status !== 'all') {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
        <p className="text-stone-500">{t('dashboard.noResults')}</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl p-16 text-center border border-stone-100">
      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-7 h-7 text-stone-400" />
      </div>
      <h3 className="text-lg font-medium text-stone-800 mb-2">{t('dashboard.empty.title')}</h3>
      <p className="text-stone-500 mb-8">{t('dashboard.empty.description')}</p>
      <Link
        href="/templates"
        className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-white text-sm font-medium hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #a78b4a 100%)' }}
      >
        <Sparkles className="w-4 h-4" />
        {t('dashboard.chooseTemplate')}
      </Link>
    </div>
  );
}
