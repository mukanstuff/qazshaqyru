import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { CATALOG_TEMPLATE_SLUGS } from '@/lib/templates/catalog';
import { TemplatesClient } from './TemplatesClient';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ managed?: string }>;
}

export default async function TemplatesPage({ searchParams }: Props) {
  const { managed } = await searchParams;
  const [templates, session] = await Promise.all([
    prisma.template.findMany({
      where: { isActive: true, slug: { in: [...CATALOG_TEMPLATE_SLUGS] } },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    getCurrentSession(),
  ]);

  return (
    <TemplatesClient
      templates={templates}
      isLoggedIn={Boolean(session)}
      showManaged={managed === '1'}
    />
  );
}
