import { formatKzt } from '@/lib/shared/format-price';
/**
 * Admin notifications for managed orders ("Сделаем за вас").
 *
 * Priority:
 * 1. Telegram Bot API (TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_CHAT_ID)
 * 2. Console log fallback (admin sees order in dashboard)
 */

export interface ManagedOrderNotification {
  customerName: string;
  customerPhone: string;
  templateName: string;
  eventDate?: string;
  notes?: string;
  orderId: string;
}

function formatEventDate(dateStr?: string): string {
  if (!dateStr) return 'не указана';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function buildMessage(order: ManagedOrderNotification): string {
  return [
    `📋 Новая заявка — Сделаем за вас`,
    ``,
    `👤 Клиент: ${order.customerName}`,
    `📱 Телефон: +${order.customerPhone}`,
    `🎨 Шаблон: ${order.templateName}`,
    `📅 Дата события: ${formatEventDate(order.eventDate)}`,
    order.notes ? `` : null,
    order.notes ? `📝 Пожелания: ${order.notes}` : null,
    ``,
    `🔗 Заказ: #${order.orderId.slice(0, 8)}`,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

async function sendTelegramNotification(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!botToken || !chatId) return false;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[Telegram] Failed to send managed order notification:', text);
    return false;
  }

  return true;
}

export async function sendManagedOrderNotification(
  order: ManagedOrderNotification
): Promise<boolean> {
  const message = buildMessage(order);

  const sent = await sendTelegramNotification(message);
  if (sent) {
    console.log('[Notification] Managed order sent via Telegram:', order.orderId);
    return true;
  }

  console.log('[Notification] Managed order (Telegram not configured):');
  console.log(message);

  return false;
}

// ─── Manual Kaspi payment approval (Telegram inline buttons) ───────────────
// The site owner has no automated Kaspi webhook (see checkout.ts,
// MANUAL_KASPI_PROVIDER) — they check the transfer in their own Kaspi Pay
// app by hand. This sends that check-and-approve step to Telegram instead
// of requiring a trip to /admin/orders: tapping a button there hits
// /api/telegram/webhook, which runs the exact same completeOrderPayment /
// rejectOrderPayment the admin page's button does.

export interface ManualPaymentApprovalRequest {
  orderId: string;
  invitationTitle: string;
  amountKzt: number;
  customerName?: string | null;
  customerPhone?: string | null;
}

function buildApprovalMessage(req: ManualPaymentApprovalRequest): string {
  return [
    `💳 Клиент отметил оплату вручную`,
    ``,
    `🎁 Приглашение: ${req.invitationTitle}`,
    `💰 Сумма: ${formatKzt(req.amountKzt)} ₸`,
    req.customerName ? `👤 ${req.customerName}` : null,
    req.customerPhone ? `📱 ${req.customerPhone}` : null,
    ``,
    `Сверьте с переводом в приложении Kaspi Pay, затем подтвердите или отклоните.`,
    ``,
    `🔗 Заказ: #${req.orderId.slice(0, 8)}`,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Sends the approval prompt. Returns the Telegram message id (needed to
 * edit the message in place once a button is tapped) or null if Telegram
 * isn't configured — callers should fall back to the WhatsApp/admin-panel
 * path in that case, not silently do nothing.
 */
export async function sendManualPaymentApprovalRequest(
  req: ManualPaymentApprovalRequest
): Promise<{ chatId: string; messageId: number } | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!botToken || !chatId) return null;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildApprovalMessage(req),
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Подтвердить', callback_data: `confirm_pay:${req.orderId}` },
              { text: '❌ Отклонить', callback_data: `reject_pay:${req.orderId}` },
            ],
          ],
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error('[Telegram] Failed to send manual-payment approval request:', await response.text());
      return null;
    }

    const data = (await response.json()) as { result?: { message_id: number } };
    if (!data.result) return null;
    return { chatId, messageId: data.result.message_id };
  } catch (err) {
    console.error('[Telegram] sendMessage failed:', err);
    return null;
  }
}

/** Edits the approval message in place to show the outcome, so the chat
 *  reads as a log instead of leaving stale buttons behind. */
export async function editTelegramMessage(
  chatId: string,
  messageId: number,
  text: string
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }),
  }).catch((err) => console.error('[Telegram] editMessageText failed:', err));
}

/** Acknowledges the button tap so Telegram stops showing the loading spinner. */
export async function answerTelegramCallback(callbackQueryId: string, text?: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  }).catch((err) => console.error('[Telegram] answerCallbackQuery failed:', err));
}
