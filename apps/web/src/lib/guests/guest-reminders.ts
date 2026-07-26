import type { GuestResponseStatus } from '@prisma/client';
import { buildWhatsAppLink } from '@/lib/guests/service';

export interface ReminderGuestInput {
  id: string;
  name: string;
  phone: string | null;
  responseStatus: GuestResponseStatus | null;
}

export interface ReminderGuestLink {
  id: string;
  name: string;
  phone: string | null;
  inviteUrl: string;
  whatsappLink: string | null;
}

/** Guests who have not confirmed attendance — eligible for RSVP reminders. */
export function isReminderTarget(status: GuestResponseStatus | null | undefined): boolean {
  if (!status) return true;
  return status === 'pending' || status === 'not_attending';
}

export function filterReminderGuests(guests: ReminderGuestInput[]): ReminderGuestInput[] {
  return guests.filter((g) => isReminderTarget(g.responseStatus));
}

export function buildReminderMessage(
  locale: 'ru' | 'kz',
  title: string,
  inviteUrl: string
): string {
  const templates = {
    ru: `Напоминание: пожалуйста, подтвердите участие в «${title}».\n`,
    kz: `Еске салу: «${title}» шақыруына қатысуыңызды растаңыз.\n`,
  };
  return `${templates[locale]}${inviteUrl}`;
}

export function buildGuestReminderLinks(params: {
  guests: Array<{ id: string; name: string; phone: string | null; token: string }>;
  slug: string;
  title: string;
  baseUrl: string;
  locale: 'ru' | 'kz';
  openRsvp: boolean;
}): ReminderGuestLink[] {
  const { guests, slug, title, baseUrl, locale, openRsvp } = params;
  const publicUrl = `${baseUrl}/i/${slug}`;

  return guests.map((g) => {
    const inviteUrl =
      openRsvp || !g.token ? publicUrl : `${baseUrl}/i/${slug}?guest=${g.token}`;
    const message = buildReminderMessage(locale, title, inviteUrl);
    return {
      id: g.id,
      name: g.name,
      phone: g.phone,
      inviteUrl,
      whatsappLink: g.phone ? buildWhatsAppLink(g.phone, message) : null,
    };
  });
}

/** Format multiple WhatsApp links for clipboard when batch-opening is blocked. */
export function formatReminderLinksForClipboard(links: ReminderGuestLink[]): string {
  return links
    .filter((l) => l.whatsappLink)
    .map((l) => `${l.name}: ${l.whatsappLink}`)
    .join('\n');
}
