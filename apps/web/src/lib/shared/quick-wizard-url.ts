import { DEFAULT_TEMPLATE_SLUG } from '@/lib/templates/catalog';

export const DEFAULT_QUICK_TEMPLATE = DEFAULT_TEMPLATE_SLUG;

/** Primary create path — QuickWizard → canvas editor. */
export function liveEditorHref(
  templateSlug: string = DEFAULT_QUICK_TEMPLATE,
  invitationId?: string,
): string {
  if (invitationId) {
    return `/invitations/${encodeURIComponent(invitationId)}/canvas`;
  }
  return `/create?template=${encodeURIComponent(templateSlug)}`;
}

/** Create/start from a template — goes through QuickWizard then canvas. */
export function quickWizardHref(templateSlug: string = DEFAULT_QUICK_TEMPLATE): string {
  return `/create?template=${encodeURIComponent(templateSlug)}`;
}

/** Legacy `/invitations/new` → quick wizard path. */
export function newInvitationRedirectHref(template?: string | null): string {
  if (!template) return '/templates';
  return quickWizardHref(template);
}
