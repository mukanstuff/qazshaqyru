import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/shared/db';

import { apiErrorResponse, requireAuth, applyAuthReadRateLimit, rateLimitResponse } from '@/lib/shared/api';



export const dynamic = 'force-dynamic';



const RECENTLY_PAID_MS = 15 * 60 * 1000;



/**

 * Pending orders for the current user (payment in progress).

 * Also returns recently paid orders so the dashboard can auto-redirect to the editor.

 */

export async function GET(request: NextRequest) {

  try {

    const ctx = await requireAuth();
    const readRate = await applyAuthReadRateLimit(request, ctx.user.id);
    if (!readRate.allowed) return rateLimitResponse(readRate);

    const recentlyPaidSince = new Date(Date.now() - RECENTLY_PAID_MS);



    const [orders, recentlyPaid] = await Promise.all([

      prisma.order.findMany({

        where: { userId: ctx.user.id, status: 'pending' },

        orderBy: { createdAt: 'desc' },

        take: 5,

        select: {

          id: true,

          invitationId: true,

          amountKzt: true,

          createdAt: true,

          paymentProvider: true,

        },

      }),

      prisma.order.findMany({

        where: {

          userId: ctx.user.id,

          status: 'paid',

          paidAt: { gte: recentlyPaidSince },

          invitationId: { not: null },

        },

        orderBy: { paidAt: 'desc' },

        take: 3,

        select: {

          id: true,

          invitationId: true,

          amountKzt: true,

          paidAt: true,

        },

      }),

    ]);



    type PendingOrderRow = { id: string; invitationId: string; amountKzt: number; paymentProvider: string | null; createdAt: Date; paidAt?: Date | null };

    return NextResponse.json({

      orders: orders.map((o: PendingOrderRow) => ({

        id: o.id,

        invitationId: o.invitationId,

        amountKzt: o.amountKzt,

        paymentProvider: o.paymentProvider,

        createdAt: o.createdAt.toISOString(),

      })),

      recentlyPaid: recentlyPaid.map((o: PendingOrderRow) => ({

        id: o.id,

        invitationId: o.invitationId,

        amountKzt: o.amountKzt,

        paidAt: o.paidAt?.toISOString() ?? null,

      })),

    });

  } catch (error) {

    return apiErrorResponse(error as Error, 'Pending orders');

  }

}

