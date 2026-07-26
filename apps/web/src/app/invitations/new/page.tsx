import { redirect } from 'next/navigation';
import { newInvitationRedirectHref } from '@/lib/shared/quick-wizard-url';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ template?: string; wizard?: string }>;
}

export default async function NewInvitationPage({ searchParams }: Props) {
  const { template } = await searchParams;
  redirect(newInvitationRedirectHref(template));
}
