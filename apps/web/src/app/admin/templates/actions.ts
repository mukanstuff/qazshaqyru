'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/shared/api';
import prisma from '@/lib/shared/db';

export async function toggleTemplateAction(id: string, field: 'isActive' | 'isFeatured') {
  await requireAdmin();

  const template = await prisma.template.findUnique({ where: { id }, select: { [field]: true } });
  if (!template) throw new Error('Шаблон не найден');

  await prisma.template.update({
    where: { id },
    data: { [field]: !template[field as keyof typeof template] },
  });

  revalidatePath('/admin/templates');
  revalidatePath('/templates');
  revalidatePath('/');
}
