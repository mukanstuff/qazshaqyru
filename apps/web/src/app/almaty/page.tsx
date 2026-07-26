import { SeoLandingPage, buildSeoLandingMetadata } from '@/components/seo/SeoEventLanding';

export async function generateMetadata() {
  return buildSeoLandingMetadata('almaty');
}

export default function AlmatyLandingPage() {
  return <SeoLandingPage landingKey="almaty" />;
}
