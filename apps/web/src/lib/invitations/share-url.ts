/** Build public invitation URL and WhatsApp share link. */
export function buildPublicInviteUrl(origin: string, slug: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/i/${slug}`;
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildInviteShareMessage(inviteUrl: string, title?: string): string {
  if (title?.trim()) {
    return `${title.trim()}\n\n${inviteUrl}`;
  }
  return inviteUrl;
}
