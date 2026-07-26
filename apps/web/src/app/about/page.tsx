import { getCurrentSession } from '@/lib/shared/api';
import { AboutPageClient } from './AboutPageClient';

export const metadata = {
  title: 'О сервисе — QazShaqyru',
  description: 'Кто мы и чем помогаем организаторам тоя и семейных торжеств.',
};

export default async function AboutPage() {
  const session = await getCurrentSession();
  return <AboutPageClient isLoggedIn={Boolean(session)} />;
}
