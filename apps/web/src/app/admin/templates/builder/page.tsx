import { redirect } from 'next/navigation';
import prisma from '@/lib/shared/db';
import { getCurrentSession } from '@/lib/shared/api';
import { createEmptyDocument } from '@/lib/canvas/mutations';
import { nanoid } from 'nanoid';
import { TemplateBuilderClient } from '@/components/admin/TemplateBuilderClient';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ id?: string; new?: string }>;
}

export default async function AdminTemplateBuilderPage({ searchParams }: Props) {
  const session = await getCurrentSession();
  if (!session || !session.user.isAdmin) {
    redirect('/admin');
  }

  const { id, new: isNew } = await searchParams;

  let templateId = id;
  if (!templateId || isNew) {
    const slug = `custom-${nanoid(8).toLowerCase()}`;
    const emptyDoc = createEmptyDocument(390, { type: 'solid', color: '#fff8f1' });

    const created = await (prisma as unknown as {
      template: {
        create: (args: unknown) => Promise<{ id: string }>;
      };
    }).template.create({
      data: {
        slug,
        nameRu: 'Новый шаблон',
        nameKz: 'Жаңа үлгі',
        category: 'wedding',
        // 2026-07-30: admin default only. Real price lives on Template.priceKzt.
        // See docs/PRODUCT_MODEL_AND_RULES.md — pay once = full access.
        priceKzt: 3990,
        previewImageUrl: '/assets/placeholder.jpg',
        // Starts hidden from the public catalog — /templates filters on
        // isActive, so a template created with this true went live the
        // instant this request finished, blank canvas and all, before the
        // admin had drawn a single element. Flip it on from the templates
        // list once it's actually ready.
        isActive: false,
        isFeatured: false,
        sortOrder: 100,
        canvas: emptyDoc as unknown as object,
      },
    });
    // Redirect instead of rendering straight through. The URL that created
    // this row still says `?new=1`, so every refresh / back-navigation to it
    // used to mint another throwaway Template (that's where the stray
    // `custom-*` rows in the DB came from). Sending the browser to `?id=` makes
    // the created row the addressable thing.
    redirect(`/admin/templates/builder?id=${created.id}`);
  }

  return <TemplateBuilderClient templateId={templateId} />;
}
