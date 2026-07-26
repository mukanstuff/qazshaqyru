import { SeoLandingPage, buildSeoLandingMetadata } from '@/components/seo/SeoEventLanding';

export async function generateMetadata() {
  return buildSeoLandingMetadata('astana');
}

export default function AstanaLandingPage() {
  return <SeoLandingPage landingKey="astana" />;
}
