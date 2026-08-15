import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { TemplatesClient } from './TemplatesClient';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const [prismaTemplates, session] = await Promise.all([
    prisma.template.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    getCurrentSession(),
  ]);

  return (
    <TemplatesClient
      templates={prismaTemplates}
      isLoggedIn={Boolean(session)}
    />
  );
}
