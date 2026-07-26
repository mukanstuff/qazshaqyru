import { SeoLandingPage, buildSeoLandingMetadata } from '@/components/seo/SeoEventLanding';

export async function generateMetadata() {
  return buildSeoLandingMetadata('betashar');
}

export default function BetasharLandingPage() {
  return <SeoLandingPage landingKey="betashar" />;
}
