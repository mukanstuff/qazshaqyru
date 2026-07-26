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
