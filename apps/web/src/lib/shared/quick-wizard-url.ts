import { DEFAULT_TEMPLATE_SLUG } from '@/lib/templates/catalog';

export const DEFAULT_QUICK_TEMPLATE = DEFAULT_TEMPLATE_SLUG;

/** Primary create / edit path — Live Editor (document truth). */
export function liveEditorHref(
  templateSlug: string = DEFAULT_QUICK_TEMPLATE,
  invitationId?: string,
): string {
  const base = `/invitations/edit?template=${encodeURIComponent(templateSlug)}`;
  if (!invitationId) return base;
  return `${base}&invitationId=${encodeURIComponent(invitationId)}`;
}

/**
 * @deprecated Prefer `liveEditorHref`. Kept as alias so existing imports keep working
 * while create flow points at Live Editor.
 */
export function quickWizardHref(templateSlug: string = DEFAULT_QUICK_TEMPLATE): string {
  return liveEditorHref(templateSlug);
}

/** Legacy `/invitations/new` → Live Editor create path. */
export function newInvitationRedirectHref(template?: string | null): string {
  if (!template) return '/templates';
  return liveEditorHref(template);
}
