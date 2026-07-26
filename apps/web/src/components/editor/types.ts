import type { CSSProperties } from 'react';
import type { InvitationData } from '@/components/invitation-layouts/types';
import type { PublishStep } from '@/components/publish/PublishStepper';

export type EditorPanel =
  | 'template'
  | 'background'
  | 'gallery'
  | 'kaspi'
  | 'social'
  | 'presets'
  | 'guests'
  | 'music'
  | null;

export type ConfirmAction =
  | { type: 'unpublish' }
  | { type: 'archive' }
  | { type: 'copyLink' }
  | { type: 'templateChange'; slug: string };

export interface EditorGuestInfo {
  id?: string;
  name: string;
  phone?: string | null;
  side?: 'bride' | 'groom' | null;
  hasPlusOne?: boolean;
  householdLabel?: string | null;
  responseStatus?: string | null;
  responseDietary?: string | null;
  responseMessage?: string | null;
  sentAt?: string | null;
  openedAt?: string | null;
}

export const editorPanelStyle: CSSProperties = {};

export interface EditorToolbarProps {
  invitation: InvitationData;
  invitationId?: string;
  guestCount?: number;
  onUpdateInvitation: (
    patch: Partial<InvitationData>,
    newTemplateData?: Record<string, unknown>,
  ) => void;
  onAddGuests: (
    guests: Array<{ name: string; phone?: string; side?: 'bride' | 'groom'; hasPlusOne?: boolean }>,
  ) => Promise<{ created: number }>;
  onDeleteGuest?: (guestId: string) => Promise<void>;
  onUpdateGuest?: (guest: {
    id: string;
    name: string;
    phone?: string | null;
    hasPlusOne?: boolean;
    householdLabel?: string | null;
  }) => Promise<void>;
  onPublish: () => Promise<boolean | void>;
  onUnpublish?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onApplyProgramPreset?: () => Promise<void>;
  isPublished: boolean;
  isSaving: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved';
  backHref?: string;
  guestNames?: string[];
  guests?: EditorGuestInfo[];
  isDraft?: boolean;
  publishPriceKzt?: number;
  isLoggedIn?: boolean;
  paymentPending?: boolean;
  widePreview?: boolean;
  onToggleWidePreview?: () => void;
  wizardMode?: boolean;
}

export type { PublishStep };
