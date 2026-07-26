import { CompareLandingPage, buildCompareMetadata } from '@/components/seo/ComparePage';

export async function generateMetadata() {
  return buildCompareMetadata('done-for-you');
}

export default function CompareDoneForYouPage() {
  return <CompareLandingPage pageKey="done-for-you" />;
}
