import { cache } from 'react';
import { notFound } from 'next/navigation';
import { resolveRestaurantPortalByToken } from '@/lib/restaurant/share-service';
import { RestaurantPortalView } from '@/components/restaurant/RestaurantPortalView';
import { getI18n } from '@/i18n/server';

export const dynamic = 'force-dynamic';

/**
 * generateMetadata and the page body both need the portal. Without this cache
 * wrapper each request resolved the share token and ran the whole portal query
 * twice — the token verification, the guest join and the headcount roll-up, all
 * duplicated for one page view.
 */
const loadPortal = cache((token: string) => resolveRestaurantPortalByToken(token));

interface Props {
  params: Promise<{ token: string }>;
}

export default async function RestaurantPortalPage({ params }: Props) {
  const { token } = await params;
  const portal = await loadPortal(decodeURIComponent(token));
  if (!portal) notFound();

  return <RestaurantPortalView portal={portal} />;
}

export async function generateMetadata({ params }: Props) {
  const [{ token }, { t }] = await Promise.all([params, getI18n()]);
  const portal = await loadPortal(decodeURIComponent(token));
  if (!portal) return { title: t('restaurantPortal.metaInvalid') };
  return {
    title: t('restaurantPortal.metaTitle', { title: portal.title }),
    robots: { index: false, follow: false },
  };
}
