import { redirect } from 'next/navigation';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { redirect?: string };
}

export default async function LoginPage({ searchParams }: Props) {
  const { getCurrentSession } = await import('@/lib/api');
  const ctx = await getCurrentSession();
  if (ctx) redirect(searchParams.redirect || '/dashboard');

  return <LoginForm redirectTo={searchParams.redirect || '/dashboard'} />;
}
