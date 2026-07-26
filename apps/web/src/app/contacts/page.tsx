import { getCurrentSession } from '@/lib/shared/api';
import { ContactsPageClient } from './ContactsPageClient';

export const metadata = {
  title: 'Контакты — QazShaqyru',
  description: 'Написать в поддержку QazShaqyru: WhatsApp, email, телефон.',
};

export default async function ContactsPage() {
  const session = await getCurrentSession();
  return <ContactsPageClient isLoggedIn={Boolean(session)} />;
}