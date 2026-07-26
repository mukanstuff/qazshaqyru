import { z } from 'zod';

export const quickWizardEventTypes = [
  'wedding',
  'toy',
  'betashar',
  'kyz_uzatu',
  'sundet_toy',
  'birthday',
  'anniversary',
  'corporate',
  'other',
] as const;

export type QuickWizardEventType = (typeof quickWizardEventTypes)[number];

export const quickWizardStep1Schema = z.object({
  eventType: z.enum(quickWizardEventTypes, {
    errorMap: () => ({ message: 'Выберите тип мероприятия' }),
  }),
});

export const quickWizardStep2Schema = z.object({
  names: z
    .string()
    .min(2, 'Укажите имена')
    .max(120, 'Слишком длинное название'),
});

export const quickWizardStep3Schema = z.object({
  eventDate: z.string().min(1, 'Укажите дату'),
  eventTime: z.string().max(20).optional().or(z.literal('')),
});

export const quickWizardStep4Schema = z.object({
  eventPlace: z.string().min(2, 'Укажите место').max(300),
  address: z.string().max(500).optional().or(z.literal('')),
});

export const quickWizardStep5Schema = z.object({
  coverPhoto: z.string().max(500).optional().or(z.literal('')),
});

export const quickWizardFormSchema = quickWizardStep1Schema
  .merge(quickWizardStep2Schema)
  .merge(quickWizardStep3Schema)
  .merge(quickWizardStep4Schema)
  .merge(quickWizardStep5Schema);

export type QuickWizardFormData = z.infer<typeof quickWizardFormSchema>;

export function buildInvitationTitle(names: string): string {
  return names.trim();
}

export function validateQuickWizardStep(
  step: number,
  data: Partial<QuickWizardFormData>
): { success: true } | { success: false; errors: Record<string, string> } {
  const schemas = [
    quickWizardStep1Schema,
    quickWizardStep2Schema,
    quickWizardStep3Schema,
    quickWizardStep4Schema,
    quickWizardStep5Schema,
  ];
  const schema = schemas[step - 1];
  if (!schema) return { success: true };

  const result = schema.safeParse(data);
  if (result.success) return { success: true };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0]?.toString() ?? 'form';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}
