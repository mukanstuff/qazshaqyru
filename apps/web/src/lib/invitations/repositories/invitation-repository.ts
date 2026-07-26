import prisma from '@/lib/shared/db';

export type OwnedInvitationSelector = {
  id: string;
  userId: string;
};

export async function findOwnedInvitationId({ id, userId }: OwnedInvitationSelector): Promise<{ id: string } | null> {
  return prisma.invitation.findFirst({
    where: { id, userId },
    select: { id: true },
  });
}

