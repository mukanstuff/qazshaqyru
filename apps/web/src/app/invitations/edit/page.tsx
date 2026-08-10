import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ template?: string; invitationId?: string }>;
}

/**
 * Legacy Live Editor route — all flows now go through QuickWizard → canvas.
 * This page stays as a redirect to avoid 404s on old links.
 */
export default async function EditRedirect({ searchParams }: Props) {
  const { template, invitationId } = await searchParams;

  if (invitationId) {
    redirect(`/invitations/${encodeURIComponent(invitationId)}/canvas`);
  }

  const templateParam = template ? `?template=${encodeURIComponent(template)}` : '';
  redirect(`/create${templateParam}`);
}
