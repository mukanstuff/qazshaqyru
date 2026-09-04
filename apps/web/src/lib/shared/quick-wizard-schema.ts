/**
 * Shape of the editor's fast-fill form (EditorSheetTabWizard).
 *
 * This file used to also export a zod schema per "step" plus
 * `validateQuickWizardStep()` and `buildInvitationTitle()` — a complete,
 * unit-tested validation layer with zero callers. The wizard is one screen,
 * not five steps, and it validates its three required fields inline; the zod
 * copy was a second, competing implementation that no code path could reach,
 * and its test suite failed permanently because it still described the
 * five-step flow that had been replaced. Type only now.
 */
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

export interface QuickWizardFormData {
  eventType: QuickWizardEventType;
  names: string;
  /** ISO date, `YYYY-MM-DD`. */
  eventDate: string;
  eventTime?: string;
  eventPlace: string;
  address?: string;
  coverPhoto?: string;
  colorScheme?: string;
}
