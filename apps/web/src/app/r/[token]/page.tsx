import { notFound } from 'next/navigation';
import { resolveRestaurantPortalByToken } from '@/lib/restaurant/share-service';
import { RestaurantPortalView } from '@/components/restaurant/RestaurantPortalView';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function RestaurantPortalPage({ params }: Props) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const portal = await resolveRestaurantPortalByToken(decoded);
  if (!portal) notFound();

  return <RestaurantPortalView portal={portal} />;
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  const portal = await resolveRestaurantPortalByToken(decodeURIComponent(token));
  if (!portal) return { title: 'Ссылка недействительна' };
  return {
    title: `${portal.title} — список гостей для зала`,
    robots: { index: false, follow: false },
  };
}
