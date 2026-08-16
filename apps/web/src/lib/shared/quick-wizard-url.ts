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

/**
 * Direct catalog → editor entry (toi.com.kz style).
 * `/editor/[templateKey]` opens the canvas editor at a stable URL with no
 * /invitations/{uuid}/canvas hop. Server creates a draft on first visit,
 * cookie binds the user to the same draft on subsequent visits.
 */
export function editorHref(templateSlug: string = DEFAULT_QUICK_TEMPLATE): string {
  return `/editor/${encodeURIComponent(templateSlug)}`;
}

/** Create/start from a template — goes through demo preview, then wizard → canvas. */
export function quickWizardHref(templateSlug: string = DEFAULT_QUICK_TEMPLATE): string {
  return `/preview/${encodeURIComponent(templateSlug)}`;
}

/** Legacy `/invitations/new` → quick wizard path. */
export function newInvitationRedirectHref(template?: string | null): string {
  if (!template) return '/templates';
  return quickWizardHref(template);
}
