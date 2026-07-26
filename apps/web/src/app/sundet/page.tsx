import { SeoLandingPage, buildSeoLandingMetadata } from '@/components/seo/SeoEventLanding';

export async function generateMetadata() {
  return buildSeoLandingMetadata('sundet');
}

export default function SundetLandingPage() {
  return <SeoLandingPage landingKey="sundet" />;
}
