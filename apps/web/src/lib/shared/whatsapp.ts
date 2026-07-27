/**
 * Phone → WhatsApp click-to-chat URL helper.
 * Extracted from guests/service so modules that only need the URL
 * builder don't transitively import prisma.
 */
export function buildWhatsAppLink(phone: string, message: string): string | null {
  const digits = formatPhoneForWhatsApp(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function formatPhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 11 && digits.startsWith('7')) return digits;
  if (digits.length === 10) return `7${digits}`;
  return null;
}
