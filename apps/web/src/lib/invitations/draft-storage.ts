const DRAFT_KEY = 'qazshaqyru:draft';

export interface LocalDraftGuest {
  localId: string;
  /** Set after guest is synced to the server */
  serverGuestId?: string;
  name: string;
  phone?: string;
  hasPlusOne?: boolean;
}

export interface LocalDraft {
  templateKey: string;
  templateId?: string;
  /** Server-side draft invitation id after «save to account» */
  serverInvitationId?: string;
  title: string;
  eventType: string;
  eventDate: string;
  eventTime?: string | null;
  eventPlace?: string | null;
  address?: string | null;
  mapUrl?: string | null;
  musicUrl?: string | null;
  templateData: Record<string, unknown>;
  customText: Record<string, unknown>;
  guests: LocalDraftGuest[];
  eventTimezone: string;
  language: 'kz' | 'ru';
  updatedAt: string;
  /** Set when created via quick wizard flow */
  fromWizard?: boolean;
}

export function draftHasMeaningfulContent(draft: LocalDraft): boolean {
  const defaultTitle = draft.templateKey;
  if (draft.title && draft.title !== defaultTitle && draft.title !== 'Моё приглашение') {
    return true;
  }
  if (draft.guests.length > 0) return true;
  if (draft.musicUrl) return true;
  if (draft.mapUrl || draft.address) return true;
  const custom = draft.customText as Record<string, unknown>;
  if (custom?.aboutCouple || custom?.greeting || custom?.dressCode || custom?.footer) return true;
  const data = draft.templateData as Record<string, unknown>;
  if (data?.coverUrl || data?.bgUrl) return true;
  return false;
}

export function loadDraft(): LocalDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalDraft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: LocalDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // localStorage full or unavailable
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function eventTypeFromTemplateKey(templateKey: string): string {
  if (templateKey.startsWith('kyz')) return 'kyz_uzatu';
  if (templateKey.startsWith('sundet')) return 'sundet_toy';
  const prefix = templateKey.split('-')[0];
  if (['wedding', 'toy', 'betashar', 'birthday', 'anniversary', 'corporate'].includes(prefix)) {
    return prefix;
  }
  return 'other';
}
