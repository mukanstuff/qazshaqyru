import { SeoLandingPage, buildSeoLandingMetadata } from '@/components/seo/SeoEventLanding';

export async function generateMetadata() {
  return buildSeoLandingMetadata('wedding');
}

export default function WeddingLandingPage() {
  return <SeoLandingPage landingKey="wedding" />;
}
