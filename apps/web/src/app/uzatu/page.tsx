import { SeoLandingPage, buildSeoLandingMetadata } from '@/components/seo/SeoEventLanding';

export async function generateMetadata() {
  return buildSeoLandingMetadata('uzatu');
}

export default function UzatuLandingPage() {
  return <SeoLandingPage landingKey="uzatu" />;
}
