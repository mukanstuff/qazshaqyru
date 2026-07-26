import { SeoLandingPage, buildSeoLandingMetadata } from '@/components/seo/SeoEventLanding';

export async function generateMetadata() {
  return buildSeoLandingMetadata('mereytoi');
}

export default function MereytoiLandingPage() {
  return <SeoLandingPage landingKey="mereytoi" />;
}
