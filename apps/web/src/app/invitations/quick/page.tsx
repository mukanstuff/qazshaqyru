import { redirect } from 'next/navigation';
import { liveEditorHref } from '@/lib/shared/quick-wizard-url';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ template?: string; invitationId?: string }>;
}

/**
 * @deprecated Form-truth QuickEdit create path.
 * Redirects to Live Editor (`/invitations/edit`). Component kept for reference only.
 */
export default async function QuickInvitationPage({ searchParams }: Props) {
  const { template, invitationId } = await searchParams;
  if (!template) {
    redirect('/templates');
  }
  redirect(liveEditorHref(template, invitationId));
}
