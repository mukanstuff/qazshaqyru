import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import PublicSeatingClient from './PublicSeatingClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string }>;
}

export default async function PublicSeatingPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const guestToken = sp.guest?.trim();
  const hdrs = await headers();
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const host = hdrs.get('host') ?? 'localhost:3000';
  const origin = `${proto}://${host}`;

  const url = new URL(`/api/public/seating/${slug}`, origin);
  if (guestToken) url.searchParams.set('guestToken', guestToken);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-base text-us-ink">Не удалось загрузить рассадку.</p>
      </main>
    );
  }

  const data = await res.json();
  return <PublicSeatingClient data={data} guestToken={guestToken ?? null} />;
}
