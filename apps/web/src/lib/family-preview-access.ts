import prisma from '@/lib/db';
import { verifyPreviewToken } from '@/lib/preview-token';

export async function canViewDraftPreview(slug: string, previewToken: string | undefined): Promise<boolean> {
  if (!previewToken) return false;
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: { status: true, previewTokenHash: true },
  });
  if (!invitation || invitation.status !== 'draft') return false;
  return verifyPreviewToken(previewToken, invitation.previewTokenHash);
}
