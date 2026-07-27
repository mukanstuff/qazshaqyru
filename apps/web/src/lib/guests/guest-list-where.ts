/**
 * Builds a Prisma `where` clause for listing guests, optionally filtered by
 * RSVP response status. Extracted from the API route file so the route
 * module only exports HTTP verbs (Next.js App Router constraint) while the
 * helper remains importable from unit tests.
 */

export type GuestResponseStatusFilter =
  | 'attending'
  | 'not_attending'
  | 'attending_plus_one'
  | 'attending_no_children'
  | 'pending';

export function buildGuestListWhere(
  invitationId: string,
  status: string | null,
): Record<string, unknown> {
  const where: Record<string, unknown> = { invitationId };

  if (
    status === 'attending' ||
    status === 'not_attending' ||
    status === 'attending_plus_one' ||
    status === 'attending_no_children'
  ) {
    where.response = { is: { status } };
    return where;
  }

  if (status === 'pending') {
    where.OR = [{ response: { is: null } }, { response: { is: { status: 'pending' } } }];
  }

  return where;
}
