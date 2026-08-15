/**
 * Preview page for canvas-backed templates.
 *
 * /preview/[templateKey]
 *
 * Renders Template.canvas via PreviewCanvasClient (read-only) and offers a
 * CTA to /editor/[templateKey]. Step 1.2 removed the HTML-engine path.
 */

import { getI18n } from '@/i18n/server';
import { notFound } from 'next/navigation';
import { PreviewCanvasClient } from './_components/PreviewCanvasClient';
import type { InvitationCanvasDocument } from '@/lib/canvas/types';
import { parseCanvasOrEmpty } from '@/lib/canvas/validation';
import prisma from '@/lib/shared/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ templateKey: string }>;
}

export default async function PreviewPage({ params }: Props) {
  const { templateKey: slug } = await params;
  const { locale } = await getI18n();
  const effectiveLocale = locale === 'kz' ? 'kz' : 'ru';

  const dbTemplate = await prisma.template.findUnique({
    where: { slug },
    select: { id: true, slug: true, nameRu: true, isCanvasTemplate: true, canvas: true },
  });

  if (!dbTemplate || !dbTemplate.isCanvasTemplate) {
    return notFound();
  }

  const document: InvitationCanvasDocument = parseCanvasOrEmpty(dbTemplate.canvas);

  return (
    <PreviewCanvasClient
      templateSlug={dbTemplate.slug}
      templateName={dbTemplate.nameRu}
      locale={effectiveLocale}
      document={document}
    />
  );
}
