'use client';

import { InvitationLayoutRouter } from '@/components/invitation-layouts/LayoutRouter';

interface GuestInvitationPageProps {
  slug: string;
  guestToken: string | null;
  familyToken: string | null;
  demoLayout?: string;
  suppressGuestChrome?: boolean;
}

/**
 * Dedicated guest-facing entrypoint.
 * Public pages should depend on this component instead of wiring the large
 * layout router directly, so guest UX and editor preview can diverge cleanly.
 */
export function GuestInvitationPage({
  slug,
  guestToken,
  familyToken,
  demoLayout,
  suppressGuestChrome = false,
}: GuestInvitationPageProps) {
  return (
    <InvitationLayoutRouter
      slug={slug}
      guestToken={guestToken}
      familyToken={familyToken}
      demoLayout={demoLayout}
      suppressGuestChrome={suppressGuestChrome}
    />
  );
}

