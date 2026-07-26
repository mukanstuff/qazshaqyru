import type { TemplateFieldDef } from './manifest-types';

export type CreateWizardStepId = 'who' | 'whenWhere' | 'story' | 'ready';

export interface CreateWizardStepDef {
  id: CreateWizardStepId;
  /** Manifest field keys belonging to this step (order preserved). */
  fieldKeys: string[];
  /** Soft gate: must be non-empty to advance (required keys only). */
  gateKeys: string[];
}

/**
 * Content steps for create flow. Payment funnel is separate — only last step.
 * Field keys are intersected with visible manifest fields at runtime.
 */
export const CREATE_WIZARD_STEPS: CreateWizardStepDef[] = [
  {
    id: 'who',
    fieldKeys: ['groomName', 'brideName', 'hostsLine'],
    gateKeys: ['groomName', 'brideName'],
  },
  {
    id: 'whenWhere',
    fieldKeys: ['eventDate', 'eventTime', 'venueName', 'venueAddress', 'mapUrl'],
    gateKeys: ['eventDate', 'eventTime', 'venueName'],
  },
  {
    id: 'story',
    fieldKeys: [
      'coverPhoto',
      'bodyTextKz',
      'bodyTextRu',
      'dressCodeTitle',
      'dressCodeNote',
      'finalText',
      'galleryPhoto1',
      'galleryPhoto2',
      'galleryPhoto3',
      'galleryPhoto4',
    ],
    gateKeys: [],
  },
  {
    id: 'ready',
    fieldKeys: [],
    gateKeys: [],
  },
];

/** Maps form field → `data-section` on invitation preview for focus highlight. */
export const FIELD_PREVIEW_SECTION: Record<string, string> = {
  groomName: 'hero-names',
  brideName: 'hero-names',
  hostsLine: 'body-invitation',
  eventDate: 'calendar',
  eventTime: 'calendar',
  venueName: 'venue-map',
  venueAddress: 'venue-map',
  mapUrl: 'venue-map',
  coverPhoto: 'cover-photo',
  bodyTextKz: 'body-invitation',
  bodyTextRu: 'body-invitation',
  dressCodeTitle: 'dress-code',
  dressCodeNote: 'dress-code',
  galleryPhoto1: 'gallery',
  galleryPhoto2: 'gallery',
  galleryPhoto3: 'gallery',
  galleryPhoto4: 'gallery',
  finalText: 'final-text',
};

export function getPreviewSectionForField(fieldKey: string): string | null {
  return FIELD_PREVIEW_SECTION[fieldKey] ?? null;
}

export function wizardFieldDomId(fieldKey: string): string {
  return `qe-${fieldKey}`;
}

/** Whether payment CTA may show — only Ready step, never content steps 1–3. */
export function isPaymentStep(stepId: CreateWizardStepId): boolean {
  return stepId === 'ready';
}

export function resolveWizardSteps(visibleFields: TemplateFieldDef[]): {
  steps: Array<CreateWizardStepDef & { fields: TemplateFieldDef[] }>;
} {
  const byKey = new Map(visibleFields.map((field) => [field.key, field]));

  const steps = CREATE_WIZARD_STEPS.map((step) => {
    const fields = step.fieldKeys
      .map((key) => byKey.get(key))
      .filter((field): field is TemplateFieldDef => Boolean(field));
    const gateKeys = step.gateKeys.filter((key) => byKey.has(key));
    return { ...step, fields, gateKeys };
  }).filter((step) => step.id === 'ready' || step.fields.length > 0);

  return { steps };
}

export function getMissingGateKeys(
  gateKeys: string[],
  values: Record<string, string | undefined>,
): string[] {
  return gateKeys.filter((key) => !String(values[key] ?? '').trim());
}
