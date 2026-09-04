import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiErrorResponse } from '@/lib/shared/api';

export const dynamic = 'force-dynamic';

/**
 * `type: 'open'` used to *also* increment `viewCount` here — a second,
 * independent write to the same counter that POST
 * /api/invitations/public/[slug]/view already owns (see that route for the
 * owner-exclusion + per-visitor dedup logic). CanvasGuestPage fired both on
 * every real visit, so every guest view was counted twice. View counting now
 * lives only in the /view route; this one is a no-op placeholder for the
 * other event types below, none of which are wired up from the client yet —
 * whoever wires the first one up should decide then whether it needs the
 * same anti-gaming treatment `/view` has.
 */
const eventSchema = z.object({
  type: z.enum(['open', 'rsvp_click', 'map_click', 'program_click', 'wishes_click']),
  userAgent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Invitation event');
  }
}
