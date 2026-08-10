import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { TemplatesClient } from './TemplatesClient';
import { getHtmlTemplateDescriptor, listHtmlTemplateSlugs } from '@/lib/templates/manifests';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const [prismaTemplates, session] = await Promise.all([
    prisma.template.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    getCurrentSession(),
  ]);

  // Include HTML-engine templates in the catalog
  const htmlSlugs = listHtmlTemplateSlugs();
  const htmlTemplates = htmlSlugs
    .map((slug) => {
      const d = getHtmlTemplateDescriptor(slug);
      if (!d) return null;
      return {
        id: `html:${slug}`,
        slug: d.slug,
        nameRu: d.name,
        nameKz: d.name,
        descriptionRu: `Шаблон: ${d.slug}`,
        descriptionKz: `Шаблон: ${d.slug}`,
        category: 'wedding' as const,
        previewImageUrl: null,
        priceKzt: 0,
        isFeatured: false,
        isActive: true,
        sortOrder: 999,
        createdAt: new Date(),
        config: null,
      };
    })
    .filter(Boolean);

  // Merge Prisma + HTML-engine templates
  const templates = [...prismaTemplates, ...(htmlTemplates as any[])];

  return (
    <TemplatesClient
      templates={templates}
      isLoggedIn={Boolean(session)}
    />
  );
}
