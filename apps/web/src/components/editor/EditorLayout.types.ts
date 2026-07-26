export interface InvitationForEditor {
  id: string;
  slug: string;
  status: string;
  title: string;
  eventType: string;
  eventDate: string;
  eventTime?: string | null;
  eventPlace?: string | null;
  address?: string | null;
  mapUrl?: string | null;
  musicUrl?: string | null;
  templateKey: string;
  templateData: Record<string, unknown>;
  customText: Record<string, unknown>;
  templatePreviewUrl?: string | null;
  guests: Array<{
    id: string;
    name: string;
    phone: string | null;
    side: string | null;
    hasPlusOne: boolean;
    plusOneName?: string | null;
    householdLabel?: string | null;
    guestToken?: string | null;
    sentAt?: string | null;
    openedAt?: string | null;
    responseStatus?: string | null;
  }>;
  eventTimezone: string;
  language: 'kz' | 'ru';
  hostName?: string | null;
  isPast: boolean;
}
