'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';
import {
  type QuickWizardFormData,
  type QuickWizardEventType,
  validateQuickWizardStep,
  buildInvitationTitle,
} from '@/lib/shared/quick-wizard-schema';
import { namesToGroomBride } from '@/lib/shared/name-split';
import {
  saveDraft,
  eventTypeFromTemplateKey,
  type LocalDraft,
} from '@/lib/invitations/draft-storage';
import { syncDraftToServer } from '@/lib/invitations/draft-sync-client';

const EMPTY_FORM: QuickWizardFormData = {
  eventType: 'wedding',
  names: '',
  eventDate: '',
  eventTime: '',
  eventPlace: '',
  address: '',
  coverPhoto: '',
  colorScheme: undefined,
};

const FORM_DRAFT_KEY = 'qazshaqyru_wizard_draft';
const PENDING_AFTER_LOGIN_KEY = 'qazshaqyru:wizard:pendingAfterLogin';

export function formToDraft(
  form: QuickWizardFormData,
  templateKey: string,
  templateId: string,
  templateName: string,
  language: 'ru' | 'kz'
): LocalDraft {
  const title = buildInvitationTitle(form.names) || templateName;

  return {
    templateKey,
    templateId,
    title,
    eventType: form.eventType,
    eventDate: new Date(form.eventDate).toISOString(),
    eventTime: form.eventTime || null,
    eventPlace: form.eventPlace,
    address: form.address || null,
    mapUrl: null,
    musicUrl: null,
    templateData: {
      ...(form.coverPhoto ? { coverPhoto: form.coverPhoto } : {}),
      ...(form.colorScheme ? { colorScheme: form.colorScheme } : {}),
    },
    customText: {
      greeting: form.names,
      invitationLocale: language,
      // Parse "Иван & Мария" → groomName + brideName so canvas placeholders
      // (placeholderKey 'coupleNames' / 'groomName' / 'brideName') bind
      // correctly. Without these, ensure-canvas sees empty names and the
      // template keeps its hard-coded "Айбек & Айдана" defaults.
      ...namesToGroomBride(form.names),
    },
    guests: [],
    eventTimezone: 'Asia/Almaty',
    language,
    fromWizard: true,
    updatedAt: new Date().toISOString(),
  };
}

export interface UseWizardFormArgs {
  templateKey: string;
  templateId: string;
  templateName: string;
  /** Return-to path for Google OAuth round-trip. */
  returnTo?: string;
  /** Optional: skip the auto-login modal (when host handles auth). */
  onAfterPersist?: (invitationId: string, slug: string) => void;
  /** Optional: require login panel & flow. Default true. */
  requireAuth?: boolean;
}

export interface UseWizardFormResult {
  form: QuickWizardFormData;
  errors: Record<string, string>;
  updateForm: (patch: Partial<QuickWizardFormData>) => void;
  isSubmitting: boolean;
  showLogin: boolean;
  /** Open the login modal manually (e.g. from a header button). */
  openLogin: () => void;
  closeLogin: () => void;
  /** Persist draft + create server invitation. Returns new id. */
  submit: () => Promise<string | null>;
  /** After login modal: run the actual submission. */
  onLoginSuccess: () => Promise<void>;
}

export function useWizardForm({
  templateKey,
  templateId,
  templateName,
  returnTo,
  onAfterPersist,
  requireAuth = true,
}: UseWizardFormArgs): UseWizardFormResult {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useI18n();

  const [form, setForm] = useState<QuickWizardFormData>({
    ...EMPTY_FORM,
    eventType: eventTypeFromTemplateKey(templateKey) as QuickWizardEventType,
    eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<LocalDraft | null>(null);
  const resumeInFlightRef = useRef(false);

  // Hydrate from localStorage.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FORM_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setForm((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form]);

  // Resume flow after Google OAuth.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('resume') !== '1') return;
    if (resumeInFlightRef.current) return;
    let pending: LocalDraft | null = null;
    try {
      const raw = localStorage.getItem(PENDING_AFTER_LOGIN_KEY);
      if (raw) pending = JSON.parse(raw) as LocalDraft;
    } catch {
      /* ignore */
    }
    if (!pending) return;
    resumeInFlightRef.current = true;

    let cancelled = false;
    (async () => {
      setIsSubmitting(true);
      try {
        const result = await syncDraftToServer(pending!);
        const next = { ...pending!, serverInvitationId: result.serverInvitationId };
        saveDraft(next);
        try {
          localStorage.removeItem(PENDING_AFTER_LOGIN_KEY);
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          if (onAfterPersist) {
            onAfterPersist(result.serverInvitationId, result.slug);
          } else {
            router.replace(`/invitations/${result.serverInvitationId}/canvas`);
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            title: t('invitation.editorToasts.publishFailed'),
            description: err instanceof Error ? err.message : t('checkout.genericError'),
            variant: 'destructive',
          });
          setIsSubmitting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, toast, t, onAfterPersist]);

  const updateForm = useCallback((patch: Partial<QuickWizardFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors({});
  }, []);

  const persistDraft = async (): Promise<{ id: string; slug: string }> => {
    const draft = formToDraft(form, templateKey, templateId, templateName, locale);
    saveDraft(draft);
    const result = await syncDraftToServer(draft);
    const next = { ...draft, serverInvitationId: result.serverInvitationId };
    saveDraft(next);
    return { id: result.serverInvitationId, slug: result.slug };
  };

  const submit = async (): Promise<string | null> => {
    const validation = validateQuickWizardStep(1, form);
    if (!validation.success) {
      setErrors(validation.errors);
      return null;
    }
    setErrors({});

    try {
      localStorage.removeItem(FORM_DRAFT_KEY);
    } catch {
      /* ignore */
    }

    if (requireAuth) {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (!sessionData.user) {
        const draft = formToDraft(form, templateKey, templateId, templateName, locale);
        saveDraft(draft);
        try {
          localStorage.setItem(PENDING_AFTER_LOGIN_KEY, JSON.stringify(draft));
        } catch {
          /* ignore */
        }
        setPendingDraft(draft);
        setShowLogin(true);
        return null;
      }
    }

    setIsSubmitting(true);
    try {
      const { id, slug } = await persistDraft();
      if (onAfterPersist) {
        onAfterPersist(id, slug);
      } else {
        router.push(`/invitations/${id}/canvas`);
      }
      return id;
    } catch (err) {
      toast({
        title: t('invitation.editorToasts.publishFailed'),
        description: err instanceof Error ? err.message : t('checkout.genericError'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLoginSuccess = async () => {
    setShowLogin(false);
    if (!pendingDraft) return;
    setIsSubmitting(true);
    try {
      const result = await syncDraftToServer(pendingDraft);
      const next = { ...pendingDraft, serverInvitationId: result.serverInvitationId };
      saveDraft(next);
      try {
        localStorage.removeItem(PENDING_AFTER_LOGIN_KEY);
      } catch {
        /* ignore */
      }
      if (onAfterPersist) {
        onAfterPersist(result.serverInvitationId, result.slug);
      } else {
        router.push(`/invitations/${result.serverInvitationId}/canvas`);
      }
    } catch (err) {
      toast({
        title: t('invitation.editorToasts.publishFailed'),
        description: err instanceof Error ? err.message : t('checkout.genericError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    errors,
    updateForm,
    isSubmitting,
    showLogin,
    openLogin: () => setShowLogin(true),
    closeLogin: () => setShowLogin(false),
    submit,
    onLoginSuccess,
  };
}

export function getWizardReturnTo(templateKey: string): string {
  return `/preview/${encodeURIComponent(templateKey)}?resume=1`;
}
