import prisma from '@/lib/shared/db';

export type LandingPublicStats = {
  publishedInvitations: number;
};

const EMPTY_STATS: LandingPublicStats = { publishedInvitations: 0 };

export async function getLandingPublicStats(): Promise<LandingPublicStats> {
  try {
    const publishedInvitations = await prisma.invitation.count({
      where: { status: 'published' },
    });

    return { publishedInvitations };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[landing] public stats unavailable, using fallback:', error);
    }
    return EMPTY_STATS;
  }
}
