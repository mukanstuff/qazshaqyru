import { CityEventLanding, buildCityEventMetadata } from '@/components/seo/CityEventLanding';
import { CITY_SLUGS } from '@/lib/seo/cities';

const EVENT = 'sundet';

/** Only the known cities exist as pages; anything else 404s (see middleware). */
export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: { city: string } }) {
  return buildCityEventMetadata({ event: EVENT, city: params.city });
}

export default async function Page({ params }: { params: { city: string } }) {
  return <CityEventLanding event={EVENT} city={params.city} />;
}
