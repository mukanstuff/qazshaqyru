import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import prisma from '@/lib/shared/db';
import { getPaymentProvider } from '@/lib/payments';
import { completeOrderPayment } from '@/lib/payments/order-completion';
import { applyRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from '@/lib/shared/api';

export const dynamic = 'force-dynamic';

interface Props {
  params: { provider: string };
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const providerName = params.provider?.toLowerCase();
    if (providerName !== 'kaspi' && providerName !== 'freedom') {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'validation_error', message: 'Unknown provider' }, meta: {} },
        { status: 400 }
      );
    }

    const body = await request.text();
    if (!body || body.trim() === '') {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'invalid_json', message: 'Empty webhook body' }, meta: {} },
        { status: 400 }
      );
    }

    const signature =
      providerName === 'kaspi'
        ? request.headers.get('x-kaspi-signature') || ''
        : request.headers.get('x-freedom-signature') || '';
    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'webhook_error', message: 'Missing signature header' },
          meta: {},
        },
        { status: 401 }
      );
    }

    const ip = getClientIp(request) || 'unknown';
    const signatureHash = createHash('sha256').update(signature).digest('hex').slice(0, 16);
    const rate = await applyRateLimit(request, `webhook:${providerName}:${signatureHash}:${ip}`, RATE_LIMITS.API_WEBHOOK);
    if (!rate.allowed) return rateLimitResponse(rate);

    const provider = getPaymentProvider(providerName as 'kaspi' | 'freedom');
    const result = await provider.verifyWebhook(body, signature);
    if (!result) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'webhook_error', message: 'Invalid signature' }, meta: {} },
        { status: 401 }
      );
    }

    const payloadHash = createHash('sha256').update(body).digest('hex');
    // Include result.action in the dedupe key so intermediate/ignore events for the same
    // paymentId do NOT collide with the final complete/cancel event.
    // Without this, a `processing` → `paid` chain would mark the processing event as
    // processed=true and the final `paid` event would be dropped as a duplicate.
    const dedupeSource = result.paymentId
      ? `${result.action}:${result.paymentId}`
      : `${result.action}:${result.orderId}:${payloadHash}`;
    const dedupeKey = createHash('sha256').update(`${providerName}:${dedupeSource}`).digest('hex');
    const existingEvent = await prisma.paymentWebhookEvent.findUnique({
      where: { dedupeKey },
      select: { id: true, processed: true, action: true, retryCount: true },
    });
    if (existingEvent?.processed) {
      return NextResponse.json({
        success: true,
        data: { alreadyProcessed: true },
        error: null,
        meta: { duplicate: true, action: existingEvent.action },
      });
    }

    const eventId = existingEvent
      ? existingEvent.id
      : (
          await prisma.paymentWebhookEvent.create({
            data: {
              provider: providerName,
              dedupeKey,
              orderId: result.orderId,
              paymentId: result.paymentId ?? null,
              action: result.action,
              signatureValid: true,
              payloadHash,
              processingState: 'pending',
              lastAttemptAt: new Date(),
            },
            select: { id: true },
          })
        ).id;

    if (existingEvent) {
      await prisma.paymentWebhookEvent.update({
        where: { id: eventId },
        data: {
          processingState: 'retry',
          retryCount: { increment: 1 },
          lastAttemptAt: new Date(),
          lastError: null,
        },
      });
    }

    try {
      if (result.action === 'ignore') {
        await markWebhookEventProcessed(eventId);
        return NextResponse.json({
          success: true,
          data: { ignored: true },
          error: null,
          meta: existingEvent ? { retried: true } : {},
        });
      }

      if (result.action === 'complete') {
        if (result.paidAmountKzt === undefined) {
          console.error('[Webhook] Missing paid amount for order', result.orderId);
          await markWebhookEventFailed(eventId, 'error', 'missing_amount');
          return NextResponse.json(
            { success: false, data: null, error: { code: 'payment_error', message: 'Missing amount' }, meta: {} },
            { status: 400 }
          );
        }
        const completion = await completeOrderPayment(result.orderId, {
          expectedProvider: providerName,
          paidAmountKzt: result.paidAmountKzt,
          expectedPaymentId: result.paymentId,
        });
        if (!completion.ok) {
          if (completion.reason === 'not_found' || completion.reason === 'wrong_order_type') {
            await markWebhookEventFailed(eventId, 'error', completion.reason);
            return NextResponse.json(
              { success: false, data: null, error: { code: 'not_found', message: 'Order not found' }, meta: {} },
              { status: 404 }
            );
          }
          if (completion.reason === 'amount_mismatch') {
            console.error('[Webhook] Amount mismatch for order', result.orderId);
            await markWebhookEventFailed(eventId, 'error', completion.reason);
            return NextResponse.json(
              { success: false, data: null, error: { code: 'payment_error', message: 'Amount mismatch' }, meta: {} },
              { status: 400 }
            );
          }
          await markWebhookEventFailed(eventId, 'retry', completion.reason);
          return NextResponse.json(
            { success: false, data: null, error: { code: 'webhook_error', message: completion.reason }, meta: {} },
            { status: 400 }
          );
        }
        await markWebhookEventProcessed(eventId);
        return NextResponse.json({
          success: true,
          data: { alreadyProcessed: completion.alreadyPaid },
          error: null,
          meta: existingEvent ? { retried: true } : {},
        });
      }

      const cancelWhere: {
        id: string;
        status: 'pending';
        orderType: 'self';
        paymentId?: string;
      } = {
        id: result.orderId,
        status: 'pending',
        orderType: 'self',
      };
      if (result.paymentId) {
        cancelWhere.paymentId = result.paymentId;
      }

      const updated = await prisma.order.updateMany({
        where: cancelWhere,
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      await markWebhookEventProcessed(eventId);
      if (updated.count === 0) {
        return NextResponse.json({
          success: true,
          data: { alreadyProcessed: true },
          error: null,
          meta: existingEvent ? { retried: true } : {},
        });
      }
      return NextResponse.json({
        success: true,
        data: { cancelled: true },
        error: null,
        meta: existingEvent ? { retried: true } : {},
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unhandled_retryable_error';
      await markWebhookEventFailed(eventId, 'retry', message);
      throw error;
    }
  } catch (error) {
    console.error('[Webhook] Unhandled error:', error);
    return NextResponse.json(
      { success: false, data: null, error: { code: 'server_error', message: 'Internal webhook error' }, meta: {} },
      { status: 500 }
    );
  }
}

async function markWebhookEventProcessed(id: string) {
  await prisma.paymentWebhookEvent.update({
    where: { id },
    data: {
      processed: true,
      processedAt: new Date(),
      processingState: 'processed',
      lastAttemptAt: new Date(),
      lastError: null,
    },
  });
}

async function markWebhookEventFailed(id: string, processingState: 'retry' | 'error', lastError: string) {
  await prisma.paymentWebhookEvent.update({
    where: { id },
    data: {
      processed: false,
      processedAt: null,
      processingState,
      lastAttemptAt: new Date(),
      lastError,
    },
  });
}
