import { redirect } from 'next/navigation';
import { resolveTemplateBySlug } from '@/lib/templates/template-resolve';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ template?: string }>;
}

/**
 * /create?template=<slug> → /preview/<slug>
 * Preserves backwards compatibility for old links and the OAuth returnTo path.
 */
export default async function CreatePageRedirect({ searchParams }: Props) {
  const { template: slug } = await searchParams;
  if (!slug) {
    redirect('/templates');
  }
  const template = await resolveTemplateBySlug(slug);
  if (!template) {
    redirect('/templates');
  }
  redirect(`/preview/${encodeURIComponent(template.slug)}`);
}
