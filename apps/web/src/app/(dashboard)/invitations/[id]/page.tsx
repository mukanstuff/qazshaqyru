import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Eye } from 'lucide-react';
import { getCurrentSession } from '@/lib/api';
import { getI18n } from '@/i18n/server';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LogoutButton } from '@/components/logout-button';
import { StatusBadge } from '@/components/status-badge';
import { InvitationEditor } from '@/components/invitation-editor';
import { getOrCreateGuestLinks, getGuestStatsForInvitation } from '@/services/guests';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}

export default async function EditInvitationPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const ctx = await getCurrentSession();
  if (!ctx) redirect(`/login?redirect=/invitations/${id}`);

  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: ctx.user.id },
    include: {
      template: true,
      _count: { select: { guests: true } },
    },
  });

  if (!invitation) notFound();

  // Pull guest stats in one round-trip (no N+1) and current share
  // links for each guest. The links are issued lazily and rotated
  // unless the guest has already been sent the invitation, so opening
  // the editor does not invalidate existing WhatsApp shares.
  const [stats, guestLinks] = await Promise.all([
    getGuestStatsForInvitation(id),
    getOrCreateGuestLinks(id),
  ]);

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-40 backdrop-blur bg-white/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm text-stone-600">К приглашениям</span>
          </Link>
          <div className="flex items-center gap-3">
            {invitation.status === 'published' && (
              <Link
                href={`/i/${invitation.slug}`}
                target="_blank"
                className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg text-sm text-stone-600 hover:bg-stone-100"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Открыть
              </Link>
            )}
            <LanguageSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {sp.paid === '1' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <span>✓</span>
            <span>Оплата прошла. Приглашение создано — заполните детали и опубликуйте.</span>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={invitation.status} />
            <span className="text-xs text-stone-500">
              {new Date(invitation.eventDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="font-serif text-3xl text-stone-800">{invitation.title}</h1>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Гостей" value={stats.total} />
          <Stat label="Подтвердили" value={stats.attending + stats.attendingPlusOne} accent="emerald" />
          <Stat label="Ожидают" value={stats.pending} accent="amber" />
        </div>

        <InvitationEditor
          invitation={{
            id: invitation.id,
            slug: invitation.slug,
            status: invitation.status,
            title: invitation.title,
            eventType: invitation.eventType,
            eventDate: invitation.eventDate.toISOString(),
            eventTime: invitation.eventTime,
            eventPlace: invitation.eventPlace,
            address: invitation.address,
            mapUrl: invitation.mapUrl,
            musicUrl: invitation.musicUrl,
            templateKey: invitation.templateKey,
            templateData: (invitation.templateData as Record<string, unknown>) || {},
            customText: (invitation.customText as Record<string, unknown>) || {},
            guests: guestLinks.map((g) => ({
              id: g.id,
              name: g.name,
              phone: g.phone,
              side: null,
              hasPlusOne: false,
              plusOneName: null,
              guestToken: g.token,
              sentAt: g.sentAt?.toISOString() ?? null,
            })),
          }}
        />
      </div>
    </main>
  );
}

function Stat({ label, value, accent = 'stone' }: { label: string; value: number; accent?: 'stone' | 'emerald' | 'amber' }) {
  const colors = { stone: 'text-stone-700', emerald: 'text-emerald-600', amber: 'text-amber-600' };
  return (
    <div className="bg-white rounded-xl px-4 py-3 border border-stone-100">
      <p className="text-xs text-stone-400">{label}</p>
      <p className={`text-2xl font-light ${colors[accent]}`}>{value}</p>
    </div>
  );
}
