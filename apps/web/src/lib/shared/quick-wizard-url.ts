/**
 * URL builders for the catalog → editor path.
 *
 * Every function here used to default its `templateSlug` argument to
 * `DEFAULT_TEMPLATE_SLUG` (`luxe-gold`), a slug with no row in the Template
 * table. A call with no argument silently produced a link to a template that
 * does not exist — which is exactly how the landing page ended up pointing at
 * `/i/demo?layout=luxe-gold`. The slug is now a required argument, so the
 * compiler rejects the call instead of the user hitting a dead page.
 *
 * `liveEditorHref` and `newInvitationRedirectHref` were removed along with the
 * `/invitations/new` route they served: nothing called either of them.
 */

/** Catalog card → canvas editor. Server creates the draft on first visit. */
export function editorHref(templateSlug: string): string {
  return `/editor/${encodeURIComponent(templateSlug)}`;
}
