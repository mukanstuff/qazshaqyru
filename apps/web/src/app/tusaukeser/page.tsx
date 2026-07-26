import { SeoLandingPage, buildSeoLandingMetadata } from '@/components/seo/SeoEventLanding';

export async function generateMetadata() {
  return buildSeoLandingMetadata('tusaukeser');
}

export default function TusaukeserLandingPage() {
  return <SeoLandingPage landingKey="tusaukeser" />;
}
