import { redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { QuickWizard } from '@/components/quick-wizard/QuickWizard';
import { DEFAULT_TEMPLATE_SLUG } from '@/lib/templates/catalog';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';
import { getI18n } from '@/i18n/server';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ template?: string }>;
}

export default async function CreatePage({ searchParams }: Props) {
  const { template: slugQuery } = await searchParams;
  const slug = slugQuery || DEFAULT_TEMPLATE_SLUG;
  const template = await resolveTemplateBySlug(slug);

  if (!template) {
    redirect('/templates');
  }

  return (
    <QuickWizard
      templateKey={template.slug}
      templateId={template.id}
      templateName={template.nameRu}
    />
  );
}
