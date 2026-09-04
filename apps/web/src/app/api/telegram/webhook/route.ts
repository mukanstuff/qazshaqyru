import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { completeOrderPayment, rejectOrderPayment } from '@/lib/payments/order-completion';
import { editTelegramMessage, answerTelegramCallback } from '@/lib/shared/notifications';

export const dynamic = 'force-dynamic';

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: {
    chat: { id: number };
    message_id: number;
    text?: string;
  };
}

interface TelegramUpdate {
  callback_query?: TelegramCallbackQuery;
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Telegram webhook for the manual-Kaspi-payment approval buttons (see
 * sendManualPaymentApprovalRequest in lib/shared/notifications.ts).
 * Telegram doesn't sign webhook bodies — auth is the `secret_token` it
 * echoes back verbatim in this header once registered via setWebhook
 * (https://api.telegram.org/bot<token>/setWebhook?url=...&secret_token=...).
 */
export async function POST(request: NextRequest) {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ ok: false, error: 'webhook_not_configured' }, { status: 503 });
  }

  const receivedSecret = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (!constantTimeEqual(receivedSecret, configuredSecret)) {
    return NextResponse.json({ ok: false, error: 'invalid_secret' }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const callback = update?.callback_query;
  if (!callback?.data || !callback.message) {
    // Not a button tap we care about — still 200 so Telegram doesn't retry forever.
    return NextResponse.json({ ok: true });
  }

  const { chat, message_id: messageId } = callback.message;
  const [action, orderId] = callback.data.split(':');

  if (!orderId || (action !== 'confirm_pay' && action !== 'reject_pay')) {
    await answerTelegramCallback(callback.id);
    return NextResponse.json({ ok: true });
  }

  const shortId = orderId.slice(0, 8);

  if (action === 'confirm_pay') {
    const result = await completeOrderPayment(orderId);
    if (result.ok) {
      await answerTelegramCallback(callback.id, 'Подтверждено');
      await editTelegramMessage(
        String(chat.id),
        messageId,
        `✅ Оплата подтверждена — заказ #${shortId} открыт.`
      );
    } else {
      await answerTelegramCallback(callback.id, 'Не удалось подтвердить');
      await editTelegramMessage(
        String(chat.id),
        messageId,
        `⚠️ Не удалось подтвердить заказ #${shortId} (${result.reason}). Проверьте /admin/orders.`
      );
    }
  } else {
    const result = await rejectOrderPayment(orderId);
    if (result.ok) {
      await answerTelegramCallback(callback.id, 'Отклонено');
      await editTelegramMessage(String(chat.id), messageId, `❌ Заказ #${shortId} отклонён.`);
    } else {
      await answerTelegramCallback(callback.id, 'Не удалось отклонить');
      await editTelegramMessage(
        String(chat.id),
        messageId,
        `⚠️ Не удалось отклонить заказ #${shortId} — возможно, уже обработан.`
      );
    }
  }

  return NextResponse.json({ ok: true });
}
