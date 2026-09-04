import { redirect } from 'next/navigation';

import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { getInvitationPricing } from '@/lib/invitations/invitation-pricing';
import { listSeatingTables } from '@/lib/guests/seating';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { SeatingPlanner } from '@/components/seating/SeatingPlanner';
import type { PlannerGuest } from '@/components/seating/useSeatingPlan';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function SeatingPlanPage({ params }: Props) {
  const ctx = await getCurrentSession();
  if (!ctx) redirect('/login');

  const { id } = params;

  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: ctx.user.id },
    select: {
      id: true,
      title: true,
      status: true,
      guests: {
        select: {
          id: true,
          name: true,
          hasPlusOne: true,
          response: { select: { status: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 2000,
      },
    },
  });

  if (!invitation) redirect('/dashboard');

  // Seating is a paid feature. Send unpaid owners back to the hub, which is
  // where the upgrade CTA lives — rather than rendering a planner whose every
  // action would 402.
  const pricing = await getInvitationPricing(invitation.id, ctx.user.id);
  if (!pricing?.fullAccess && !pricing?.entitlements.seating) {
    redirect(`/invitations/${invitation.id}`);
  }

  const tables = await listSeatingTables(invitation.id, ctx.user.id);

  type GuestRow = {
    id: string;
    name: string;
    hasPlusOne: boolean;
    response: { status: string } | null;
  };

  const guests: PlannerGuest[] = (invitation.guests as GuestRow[]).map((g) => ({
    id: g.id,
    name: g.name,
    hasPlusOne: g.hasPlusOne,
    responseStatus: g.response?.status ?? null,
  }));

  const hubHref = `/invitations/${invitation.id}`;

  return (
    <>
      <SiteHeader isLoggedIn backHref={hubHref} title={invitation.title} />
      <main className="min-h-[100dvh] bg-us-ivory pt-[calc(4rem+1.5rem)] sm:pt-[calc(4rem+2rem)]">
        <SeatingPlanner
          invitationId={invitation.id}
          guestsHref={hubHref}
          initialTables={tables}
          guests={guests}
        />
      </main>
    </>
  );
}
