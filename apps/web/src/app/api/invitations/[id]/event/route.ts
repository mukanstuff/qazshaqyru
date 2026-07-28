import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/shared/db';
import { apiErrorResponse } from '@/lib/shared/api';

export const dynamic = 'force-dynamic';

interface RouteCtx {
  params: Promise<{ id: string }>;
}

const eventSchema = z.object({
  type: z.enum(['open', 'rsvp_click', 'map_click', 'program_click', 'wishes_click']),
  userAgent: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (parsed.data.type === 'open') {
      await prisma.invitation.updateMany({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err as Error, 'Invitation event');
  }
}
