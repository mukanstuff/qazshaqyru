/**
 * LayoutRouter — picks and renders the right layout
 * based on the Invitation.templateKey → TemplateConfig.layout
 *
 * Supports edit mode: when isEditing=true, each text element becomes
 * clickable for inline editing, and a toolbar appears at the top.
 */

'use client';

import '@/styles/kz-fonts.css';
import '@/styles/invitation.css';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { CaptchaWidget } from '@/components/shared/CaptchaWidget';
import { resolveTemplateKey, resolveTemplateMusicUrl } from '@/lib/templates';
import { DEFAULT_TEMPLATE_SLUG } from '@/lib/templates/catalog';
import type { TemplateConfig } from '@/lib/templates';
import {
  PlaceholderLayout,
  type InvitationData,
  type RSVPData,
} from '@/components/invitation-layouts';
import { SectionRenderer } from '@/components/invitation-layouts/SectionRenderer';
import { PublicPublishWatermark } from '@/components/invitation-layouts/PublicPublishWatermark';
import { getTemplateManifest } from '@/lib/templates/manifests';
import { manifestHasEnvelopeIntro } from '@/lib/templates/manifest-envelope';
import { getCustomTextPersistenceActions } from '@/lib/invitations/custom-text-persistence';
import { getProgramPreset } from '@/lib/templates/program-presets';
import { isOpenRsvpEnabled } from '@/lib/guests/open-rsvp-config';
import { isCaptchaRequiredOnClient } from '@/lib/shared/captcha-client';
import type { InvitationDocumentSection } from '@/lib/invitations/document';
import type { EventType } from '@prisma/client';
import { useI18n } from '@/i18n';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import {
  GuestBottomSheet,
  GuestEnvelopeIntro,
  GuestRsvpStickyBar,
  hasSeenEnvelope,
} from './guest-mobile';

interface Props {
  slug: string;
  guestToken: string | null;
  familyToken?: string | null;
  /** Demo template slug when slug === 'demo' */
  demoLayout?: string;
  isEditing?: boolean;
  initialInvitation?: InvitationData | null;
  onFieldChange?: (field: string, value: string) => Promise<void>;
  onTemplateChange?: (templateKey: string) => Promise<void>;
  onSaveDesign?: (templateKey: string, templateData: Record<string, unknown>) => Promise<void>;
  onBackgroundChange?: (url: string | undefined) => Promise<void>;
  onPublish?: () => Promise<boolean | void>;
  onUnpublish?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onAddGuests?: (guests: Array<{ name: string; phone?: string; side?: 'bride' | 'groom'; hasPlusOne?: boolean }>) => Promise<{ created: number }>;
  onDeleteGuest?: (guestId: string) => Promise<void>;
  onUpdateGuest?: (guest: { id: string; name: string; phone?: string | null; hasPlusOne?: boolean }) => Promise<void>;
  isPublished?: boolean;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved';
  backHref?: string;
  guestNames?: string[];
  guests?: Array<{ id?: string; name: string; phone?: string | null; hasPlusOne?: boolean; responseStatus?: string | null; responseDietary?: string | null; responseMessage?: string | null }>;
  invitationId?: string;
  guestCount?: number;
  isDraft?: boolean;
  publishPriceKzt?: number;
  isLoggedIn?: boolean;
  paymentPending?: boolean;
  widePreview?: boolean;
  onToggleWidePreview?: () => void;
  wizardMode?: boolean;
  /** Hide guest FAB / RSVP sticky chrome (wizard preview, embed) */
  suppressGuestChrome?: boolean;
  /** Editor preview: toolbar outside phone frame, invitation scrolls inside ArchFrame */
  previewChrome?: 'framed' | 'wide';
  /** Scrollable invitation inside an outer device frame (Quick Edit, no inner ArchFrame) */
  previewEmbedFrame?: boolean;
  /** Document sections override (Live Editor) — visibility/order from InvitationDocument. */
  documentSections?: InvitationDocumentSection[];
}

export function InvitationLayoutRouter({
  slug,
  guestToken,
  familyToken = null,
  demoLayout,
  isEditing = false,
  initialInvitation,
  onFieldChange,
  onTemplateChange,
  onSaveDesign,
  onBackgroundChange,
  onPublish,
  onUnpublish,
  onArchive,
  onAddGuests,
  onDeleteGuest,
  onUpdateGuest,
  isPublished = false,
  isSaving = false,
  saveStatus = 'idle',
  backHref = '/dashboard',
  guestNames = [],
  guests = [],
  invitationId,
  guestCount = 0,
  isDraft = false,
  publishPriceKzt = 0,
  isLoggedIn = true,
  paymentPending = false,
  widePreview = false,
  onToggleWidePreview,
  wizardMode = false,
  suppressGuestChrome = false,
  previewChrome,
  previewEmbedFrame = false,
  documentSections,
}: Props) {
  const { t, locale, setLocale } = useI18n();
  const [invitation, setInvitation] = useState<InvitationData | null>(initialInvitation ?? null);
  const [rsvpData, setRsvpData] = useState<RSVPData | null>(null);
  const [loading, setLoading] = useState(!initialInvitation);
  const [loadError, setLoadError] = useState('');
  const [rsvpError, setRsvpError] = useState('');

  // RSVP modal state
  const [showRSVP, setShowRSVP] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpDietary, setRsvpDietary] = useState('');
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [openRsvpName, setOpenRsvpName] = useState('');
  const [openRsvpPhone, setOpenRsvpPhone] = useState('');
  const [rsvpCaptchaToken, setRsvpCaptchaToken] = useState<string | null>(null);
  const rsvpWebsiteRef = useRef<HTMLInputElement>(null);
  const captchaRequired = isCaptchaRequiredOnClient();

  // Music
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Share
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canRSVP, setCanRSVP] = useState(false);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);
  const [envelopeSeen, setEnvelopeSeen] = useState(() =>
    typeof window === 'undefined' ? true : hasSeenEnvelope(slug),
  );
  const framedPreview = previewChrome === 'framed';
  const hideGuestChrome = suppressGuestChrome || framedPreview;
  const shouldDelayMusicPrompt = !isEditing && !hideGuestChrome && !envelopeSeen;
  const templateConfig = invitation ? resolveTemplateKey(invitation.templateKey) : resolveTemplateKey(demoLayout || DEFAULT_TEMPLATE_SLUG);
  const effectiveMusicUrl = invitation ? resolveTemplateMusicUrl(invitation.musicUrl, templateConfig) : null;

  const tokenStorageKey = useMemo(() => `qazshaqyru:guestToken:${slug}`, [slug]);
  const musicDecisionKey = useMemo(() => `qazshaqyru:music:${slug}`, [slug]);

  const openRsvpEnabled = useMemo(() => {
    if (slug === 'demo') return true;
    if (!invitation) return true;
    if (invitation.openRsvp === true) return true;
    if (invitation.openRsvp === false) return false;
    return isOpenRsvpEnabled(invitation.customText, invitation.eventType as EventType);
  }, [slug, invitation]);

  const getStoredToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    if (guestToken) return guestToken;
    try { return window.localStorage.getItem(tokenStorageKey); } catch { return null; }
  }, [guestToken, tokenStorageKey]);

  useEffect(() => {
    if (guestToken && typeof window !== 'undefined') {
      try { window.localStorage.setItem(tokenStorageKey, guestToken); } catch {}
    }
  }, [guestToken, tokenStorageKey]);

  useEffect(() => {
    setCanRSVP(!isEditing && (Boolean(getStoredToken()) || openRsvpEnabled));
  }, [isEditing, getStoredToken, guestToken, tokenStorageKey, openRsvpEnabled]);

  useEffect(() => {
    setEnvelopeSeen(hasSeenEnvelope(slug));
    const onEnvelopeOpen = () => setEnvelopeSeen(true);
    window.addEventListener('qazshaqyru:envelope-open', onEnvelopeOpen);
    window.addEventListener('storage', onEnvelopeOpen);
    return () => {
      window.removeEventListener('qazshaqyru:envelope-open', onEnvelopeOpen);
      window.removeEventListener('storage', onEnvelopeOpen);
    };
  }, [slug]);

  useEffect(() => { if (!initialInvitation) loadInvitation(); }, [slug, demoLayout, locale, familyToken]); // eslint-disable-line

  // Sync from parent when editing another invitation, or on every draft change in embed preview.
  const editSeedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialInvitation) return;
    if (previewEmbedFrame) {
      setInvitation(initialInvitation);
      return;
    }
    if (!isEditing) return;
    if (editSeedRef.current === initialInvitation.id) return;
    editSeedRef.current = initialInvitation.id;
    setInvitation(initialInvitation);
  }, [isEditing, initialInvitation, previewEmbedFrame]);

  // Auto-open RSVP for guests with personal link — only after envelope opens
  useEffect(() => {
    if (!invitation || !canRSVP || openRsvpEnabled || !envelopeSeen) return;
    if (!getStoredToken()) return;
    if (showRSVP) return;
    if (!rsvpStatus || rsvpStatus === 'pending') {
      const id = setTimeout(() => setShowRSVP(true), 1200);
      return () => clearTimeout(id);
    }
  }, [invitation, canRSVP, showRSVP, rsvpStatus, openRsvpEnabled, getStoredToken, envelopeSeen]);

  const loadInvitation = async () => {
    try {
      const apiUrl =
        slug === 'demo'
          ? `/api/invitations/public/demo?layout=${encodeURIComponent(demoLayout || DEFAULT_TEMPLATE_SLUG)}&locale=${locale}`
          : familyToken
            ? `/api/invitations/public/${slug}?preview=${encodeURIComponent(familyToken)}`
            : `/api/invitations/public/${slug}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error === 'not_found' ? t('public.errors.notFound') : t('public.errors.notAvailable'));
        setLoading(false);
        return;
      }
      setInvitation({
        ...(data.invitation as InvitationData),
        openRsvp: Boolean(data.invitation.openRsvp),
      });
      const invLang = data.invitation.language;
      if (!isEditing && (invLang === 'ru' || invLang === 'kz')) {
        setLocale(invLang);
      }
      const token = guestToken ?? getStoredToken();
      if (token) {
        try {
          const rsvpRes = await fetch(`/api/rsvp?guestToken=${encodeURIComponent(token)}`);
          if (rsvpRes.ok) {
            const r = await rsvpRes.json();
            setRsvpData(r);
            if (r.response?.status && r.response.status !== 'pending') setRsvpStatus(r.response.status);
          }
        } catch {}
      }
    } catch { setLoadError(t('errors.generic')); }
    finally { setLoading(false); }
  };

  const handleFieldChange = useCallback(async (field: string, value: string) => {
    if (!onFieldChange) return;
    await onFieldChange(field, value);
    // Update local state optimistically
    setInvitation((prev) => {
      if (!prev) return prev;
      if (field.startsWith('customText.')) {
        const key = field.replace('customText.', '');
        const parsedValue = key === 'openRsvp' ? value === 'true' : value;
        return {
          ...prev,
          customText: { ...prev.customText, [key]: parsedValue },
        };
      }
      if (field.startsWith('templateData.')) {
        const key = field.replace('templateData.', '');
        return {
          ...prev,
          templateData: { ...prev.templateData, [key]: value },
        };
      }
      return { ...prev, [field]: value } as InvitationData;
    });
  }, [onFieldChange]);

  const handleProgramChange = useCallback(async (program: Array<{ time: string; title: string; description?: string }>) => {
    if (!onFieldChange) return;
    await onFieldChange('customText.program', JSON.stringify(program));
    setInvitation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customText: { ...prev.customText, program },
      };
    });
  }, [onFieldChange]);

  const handleApplyProgramPreset = useCallback(async () => {
    if (!invitation) return;
    const preset = getProgramPreset(invitation.eventType as EventType, locale);
    await handleProgramChange(preset);
  }, [invitation, locale, handleProgramChange]);

  const handlePhotoSave = useCallback(async (photoKey: string, url: string) => {
    if (!onFieldChange) return;
    await onFieldChange(`templateData.${photoKey}`, url);
    setInvitation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        templateData: { ...prev.templateData, [photoKey]: url },
      };
    });
  }, [onFieldChange]);

  const handleTemplateChange = useCallback(async (templateKey: string) => {
    if (!onTemplateChange) return;
    await onTemplateChange(templateKey);
    setInvitation((prev) => {
      if (!prev) return prev;
      return { ...prev, templateKey };
    });
  }, [onTemplateChange]);

  const handleBackgroundChange = useCallback(async (url: string | undefined, newTemplateData?: Record<string, unknown>) => {
    if (newTemplateData) {
      setInvitation((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, templateData: newTemplateData };
        if (onSaveDesign) {
          void onSaveDesign(prev.templateKey, newTemplateData);
        }
        return updated;
      });
    } else if (url !== undefined) {
      setInvitation((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          templateData: { ...prev.templateData, backgroundImage: url },
        };
        if (onSaveDesign) {
          void onSaveDesign(prev.templateKey, updated.templateData as Record<string, unknown>);
        }
        return updated;
      });
    }
  }, [onSaveDesign]);

  const handleAddGuests = useCallback(async (guests: Array<{ name: string; phone?: string }>) => {
    if (!onAddGuests) return { created: 0 };
    return onAddGuests(guests);
  }, [onAddGuests]);

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
    setIsPlaying((p) => !p);
  }, [isPlaying]);

  const handleMusicInteraction = useCallback(() => {
    if (!effectiveMusicUrl || hasInteracted) { setHasInteracted(true); return; }
    setHasInteracted(true);
    let decision: string | null = null;
    try { decision = window.localStorage.getItem(musicDecisionKey); } catch {}
    if (decision === 'on' && audioRef.current) { audioRef.current.play().catch(() => {}); setIsPlaying(true); return; }
  }, [effectiveMusicUrl, hasInteracted, musicDecisionKey]);

  useEffect(() => {
    if (isEditing || !effectiveMusicUrl || hideGuestChrome) return;
    let decision: string | null = null;
    try { decision = window.localStorage.getItem(musicDecisionKey); } catch {}
    if (!decision && !shouldDelayMusicPrompt) setShowMusicPrompt(true);
  }, [effectiveMusicUrl, isEditing, musicDecisionKey, shouldDelayMusicPrompt, hideGuestChrome]);

  const handleMusicDecision = useCallback((enable: boolean) => {
    try { window.localStorage.setItem(musicDecisionKey, enable ? 'on' : 'off'); } catch {}
    setShowMusicPrompt(false);
    setHasInteracted(true);
    if (enable && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [musicDecisionKey]);

  const handleRSVP = useCallback(async (status: string) => {
    const token = getStoredToken();
    if (captchaRequired && !rsvpCaptchaToken) {
      setRsvpError(t('public.captcha.required'));
      return;
    }
    setRsvpLoading(true);
    setRsvpError('');
    const website = rsvpWebsiteRef.current?.value || undefined;
    try {
      let res: Response;
      if (token) {
        res = await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestToken: token,
            status,
            dietaryRestrictions: rsvpDietary || undefined,
            message: rsvpMessage || undefined,
            website,
            captchaToken: rsvpCaptchaToken ?? undefined,
          }),
        });
      } else if (openRsvpEnabled && invitation) {
        const name = openRsvpName.trim();
        const phone = openRsvpPhone.trim();
        if (!name) {
          setRsvpError(t('public.rsvp.nameRequired'));
          return;
        }
        if (!phone) {
          setRsvpError(t('public.rsvp.phoneRequired'));
          return;
        }
        res = await fetch('/api/rsvp/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: invitation.slug,
            name,
            phone,
            status,
            dietaryRestrictions: rsvpDietary || undefined,
            message: rsvpMessage || undefined,
            website,
            captchaToken: rsvpCaptchaToken ?? undefined,
          }),
        });
      } else {
        setRsvpError(t('public.errors.notAvailable'));
        return;
      }

      if (res.ok) {
        setRsvpStatus(status);
        setShowRSVP(false);
        setRsvpData((prev) => prev ? { ...prev, response: { ...(prev.response || {}), status } } : prev);
        setRsvpDietary('');
        setRsvpMessage('');
        setOpenRsvpName('');
        setOpenRsvpPhone('');
        setRsvpCaptchaToken(null);
      } else {
        const d = await res.json().catch(() => ({}));
        setRsvpError(d.message || t('errors.generic'));
      }
    } catch { setRsvpError(t('errors.networkError')); }
    finally { setRsvpLoading(false); }
  }, [getStoredToken, t, rsvpDietary, rsvpMessage, openRsvpEnabled, invitation, openRsvpName, openRsvpPhone, captchaRequired, rsvpCaptchaToken]);

  const handleShare = useCallback((type: 'whatsapp' | 'telegram' | 'copy') => {
    const url = `${window.location.origin}/i/${slug}`;
    if (type === 'copy') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      const shareText =
        invitation && locale === 'kz'
          ? `Сізді ${invitation.title} тойға шақырамыз!\n${url}`
          : invitation
            ? `Приглашаем вас: ${invitation.title}!\n${url}`
            : url;
      if (type === 'telegram') {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
          '_blank',
        );
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
      }
    }
    setShowShareMenu(false);
  }, [slug, invitation, locale]);

  // ─── Loading / Error ───
  // In framed preview (used by /preview/[templateKey]), wrap in .preview-invitation
  // so .guest-page's cream background (defined in invitation.css) is overridden by
  // .preview-invitation .guest-page { background: transparent } in globals.css.
  const wrapInPreviewInvitation = framedPreview;
  const previewWrapper = (inner: React.ReactNode) =>
    wrapInPreviewInvitation ? <div className="preview-invitation">{inner}</div> : inner;

  if (loading) {
    return previewWrapper(
      <div className="guest-page guest-loading">
        <div className="guest-loading__inner">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p>{t('common.loading')}</p>
        </div>
      </div>,
    );
  }

  if (loadError || !invitation) {
    return previewWrapper(
      <div className="guest-page guest-error">
        <div className="guest-error__inner">
          <span aria-hidden>!</span>
          <h2>{loadError || t('errors.generic')}</h2>
          <p>{t('public.errors.checkLink')}</p>
          <a href="/">{t('public.backHome')}</a>
        </div>
      </div>,
    );
  }

  const displayInvitation =
    !isEditing && rsvpData?.guest.name
      ? {
          ...invitation,
          guestDisplayName: rsvpData.guest.name,
          seatingTableName: rsvpData.guest.seatingTableName ?? invitation.seatingTableName,
          musicUrl: effectiveMusicUrl,
        }
      : { ...invitation, musicUrl: effectiveMusicUrl };

  const showRsvpSticky =
    !isEditing &&
    !hideGuestChrome &&
    envelopeSeen &&
    canRSVP &&
    !rsvpStatus &&
    !showRSVP;
  const envelopePending = !isEditing && !hideGuestChrome && !envelopeSeen;
  const guestPageClass = [
    'guest-page',
    templateConfig.animationClass ?? '',
    showRsvpSticky ? 'guest-page--has-rsvp-sticky' : '',
    envelopePending ? 'guest-page--envelope-pending' : '',
    slug === 'demo' ? 'guest-page--demo' : '',
    previewEmbedFrame ? 'guest-page--editor-frame' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const rsvpProps = {
    rsvpData,
    showRSVP,
    setShowRSVP,
    rsvpStatus,
    setRsvpStatus,
    rsvpLoading,
    rsvpDietary,
    setRsvpDietary,
    rsvpMessage,
    setRsvpMessage,
    handleRSVP,
  };

  const sharedProps = {
    invitation: displayInvitation,
    rsvpData,
    templateConfig,
    onOpenRSVP: () => {
      if (!envelopeSeen && !isEditing && !hideGuestChrome) return;
      setShowRSVP(true);
    },
    onShare: handleShare,
    showShareMenu,
    onToggleShare: () => setShowShareMenu((s) => !s),
    copied,
    isPlaying,
    onToggleMusic: toggleMusic,
    hasInteracted,
    rsvpStatus,
    showRSVP,
    canRSVP,
    guestToken: getStoredToken(),
    isEditing,
    onFieldSave: handleFieldChange,
    onProgramChange: handleProgramChange,
    onPhotoSave: isEditing ? handlePhotoSave : undefined,
    suppressGuestChrome: hideGuestChrome,
  };

  const manifestForChrome = getTemplateManifest(displayInvitation.templateKey);
  const skipGuestEnvelopeIntro =
    Boolean(manifestForChrome) && manifestHasEnvelopeIntro(manifestForChrome!);

  const showEditorToolbar = isEditing && !previewEmbedFrame;

  const editorToolbar = showEditorToolbar ? (
    <EditorToolbar
      invitation={invitation}
      onUpdateInvitation={(patch, newTemplateData) => {
        const prevCustomText = (invitation.customText ?? {}) as Record<string, unknown>;

        setInvitation((prev) => {
          if (!prev) return prev;
          const next = { ...prev, ...patch } as InvitationData;
          if (newTemplateData) {
            next.templateData = newTemplateData;
          }
          return next;
        });

        if (patch.templateKey && onTemplateChange) {
          void onTemplateChange(patch.templateKey);
        }

        if (patch.musicUrl !== undefined && onFieldChange) {
          void onFieldChange('musicUrl', patch.musicUrl ?? '');
        }

        if (patch.customText && onFieldChange) {
          const ct = patch.customText as Record<string, unknown>;
          for (const action of getCustomTextPersistenceActions(prevCustomText, ct)) {
            void onFieldChange(action.field, action.value);
          }
        }

        if (newTemplateData && onSaveDesign) {
          const templateKey = patch.templateKey ?? invitation.templateKey;
          void onSaveDesign(templateKey, newTemplateData);
        }
      }}
      onAddGuests={handleAddGuests}
      onDeleteGuest={onDeleteGuest}
      onUpdateGuest={onUpdateGuest}
      onPublish={onPublish || (() => Promise.resolve())}
      onUnpublish={onUnpublish}
      onArchive={onArchive}
      isPublished={isPublished}
      isSaving={isSaving}
      saveStatus={saveStatus}
      backHref={backHref}
      guestNames={guestNames}
      guests={guests}
      invitationId={invitationId}
      guestCount={guestCount}
      isDraft={isDraft}
      publishPriceKzt={publishPriceKzt}
      isLoggedIn={isLoggedIn}
      paymentPending={paymentPending}
      onApplyProgramPreset={handleApplyProgramPreset}
      widePreview={widePreview}
      onToggleWidePreview={onToggleWidePreview}
      wizardMode={wizardMode}
    />
  ) : null;

  const invitationSurface = (
    <>
      {!isEditing && invitation && !hideGuestChrome && !skipGuestEnvelopeIntro && (
        <GuestEnvelopeIntro slug={slug} title={invitation.title} accent={templateConfig.accent} />
      )}
      {!framedPreview && editorToolbar}
      {!framedPreview && showEditorToolbar && <div className="guest-editor-spacer" />}

      {effectiveMusicUrl && <audio ref={audioRef} src={effectiveMusicUrl} loop preload="none" />}

      {/* Past event banner */}
      {invitation.isPast && (
        <div className="guest-past-banner">
          <span>✦</span>
          <span>{t('public.eventPast')}</span>
          <span>✦</span>
        </div>
      )}

      {/* Music consent */}
      {showMusicPrompt && effectiveMusicUrl && envelopeSeen && (
        <GuestBottomSheet open onClose={() => handleMusicDecision(false)} data-testid="guest-music-sheet">
          <div className="guest-music-prompt">
            <span aria-hidden>♪</span>
            <h3>{t('public.music.title')}</h3>
            <p>{t('public.music.description')}</p>
          </div>
          <div className="guest-music-prompt__actions">
            <button type="button" onClick={() => handleMusicDecision(true)}>
              {t('public.music.on')}
            </button>
            <button type="button" onClick={() => handleMusicDecision(false)}>
              {t('public.music.off')}
            </button>
          </div>
        </GuestBottomSheet>
      )}

      {/* RSVP Modal — never before envelope ritual */}
      {showRSVP && (envelopeSeen || isEditing || hideGuestChrome) && (
        <RSVPModal
          rsvpData={rsvpData}
          openRsvpMode={openRsvpEnabled && !getStoredToken()}
          openRsvpName={openRsvpName}
          setOpenRsvpName={setOpenRsvpName}
          openRsvpPhone={openRsvpPhone}
          setOpenRsvpPhone={setOpenRsvpPhone}
          rsvpLoading={rsvpLoading}
          rsvpError={rsvpError}
          rsvpDietary={rsvpDietary}
          setRsvpDietary={setRsvpDietary}
          rsvpMessage={rsvpMessage}
          setRsvpMessage={setRsvpMessage}
          handleRSVP={handleRSVP}
          onClose={() => setShowRSVP(false)}
          templateConfig={templateConfig}
          rsvpWebsiteRef={rsvpWebsiteRef}
          onCaptchaTokenChange={setRsvpCaptchaToken}
          t={t}
        />
      )}

      {/* RSVP Toast */}
      {rsvpStatus && (
        <div className="guest-rsvp-toast">
          <span>✓</span>
          <span>
            {rsvpStatus === 'attending' ? t('public.rsvp.successAttending') :
             rsvpStatus === 'attending_plus_one' ? t('public.rsvp.successWithGuest') :
             rsvpStatus === 'attending_no_children' ? t('public.rsvp.successNoChildren') :
             t('public.rsvp.successNotAttending')}
          </span>
          <button type="button" onClick={() => setRsvpStatus(null)} aria-label="Close">✕</button>
        </div>
      )}

      {(() => {
        const manifest = getTemplateManifest(displayInvitation.templateKey);
        if (manifest) {
          return (
            <SectionRenderer
              manifest={manifest}
              documentSections={documentSections}
              {...sharedProps}
            />
          );
        }
        return <PlaceholderLayout {...sharedProps} />;
      })()}

      {!isEditing && Boolean(displayInvitation.showWatermark) ? (
        <PublicPublishWatermark
          show
          removeHref={`/dashboard?pay=${encodeURIComponent(displayInvitation.slug)}`}
        />
      ) : null}

      {!isEditing && (
        <GuestRsvpStickyBar
          visible={showRsvpSticky}
          onOpenRSVP={() => setShowRSVP(true)}
          accent={templateConfig.accent}
          textDark={templateConfig.textDark}
          label={t('public.sections.rsvpCtaButton')}
        />
      )}
    </>
  );

  const guestPageStyle = { '--inv-accent': templateConfig.accent } as React.CSSProperties;

  if (framedPreview) {
    return (
      <div className="preview-invitation">
        <div className={guestPageClass} onClick={handleMusicInteraction} style={guestPageStyle}>
          {invitationSurface}
        </div>
      </div>
    );
  }

  return (
    <div className={guestPageClass} onClick={handleMusicInteraction} style={guestPageStyle}>
      {invitationSurface}
    </div>
  );
}

/* ── RSVP Modal ── */
function RSVPModal({ rsvpData, openRsvpMode, openRsvpName, setOpenRsvpName, openRsvpPhone, setOpenRsvpPhone, rsvpLoading, rsvpError, rsvpDietary, setRsvpDietary, rsvpMessage, setRsvpMessage, handleRSVP, onClose, templateConfig, rsvpWebsiteRef, onCaptchaTokenChange, t }: {
  rsvpData: RSVPData | null;
  openRsvpMode?: boolean;
  openRsvpName?: string;
  setOpenRsvpName?: (v: string) => void;
  openRsvpPhone?: string;
  setOpenRsvpPhone?: (v: string) => void;
  rsvpLoading: boolean;
  rsvpError: string;
  rsvpDietary: string;
  setRsvpDietary: (v: string) => void;
  rsvpMessage: string;
  setRsvpMessage: (v: string) => void;
  handleRSVP: (status: string) => void;
  onClose: () => void;
  templateConfig: TemplateConfig;
  rsvpWebsiteRef: React.RefObject<HTMLInputElement>;
  onCaptchaTokenChange: (token: string | null) => void;
  t: (key: string) => string;
}) {
  const accent = templateConfig.accent;
  const [showOptional, setShowOptional] = useState(false);

  const actionButtons = (
    <>
      {rsvpData?.guest.hasPlusOne && (
        <button
          type="button"
          onClick={() => handleRSVP('attending_plus_one')}
          disabled={rsvpLoading}
          
        >
          {rsvpLoading ? <Loader2  /> : null}
          {t('public.rsvp.attendingWithGuest')}
        </button>
      )}
      <button
        type="button"
        onClick={() => handleRSVP('attending')}
        disabled={rsvpLoading}
        
        
      >
        {rsvpLoading ? <Loader2  /> : null}
        {t('public.rsvp.attending')}
      </button>
      <button
        type="button"
        onClick={() => handleRSVP('attending_no_children')}
        disabled={rsvpLoading}
        
      >
        {rsvpLoading ? <Loader2  /> : null}
        {t('public.rsvp.attendingNoChildren')}
      </button>
      <button
        type="button"
        onClick={() => handleRSVP('not_attending')}
        disabled={rsvpLoading}
        
      >
        {rsvpLoading ? <Loader2  /> : null}
        {t('public.rsvp.notAttending')}
      </button>
    </>
  );

  return (
    <GuestBottomSheet open onClose={onClose} data-testid="guest-rsvp-sheet">
      <div className="guest-rsvp-sheet__header">
        <h3>
          {rsvpData
            ? t('public.rsvp.titleNamed').replace('{name}', rsvpData.guest.name)
            : t('public.rsvp.title')}
        </h3>
        <p>{t('public.rsvp.subtitle')}</p>
      </div>
      {rsvpError && (
        <p className="guest-rsvp-sheet__error">{rsvpError}</p>
      )}
      {openRsvpMode && setOpenRsvpName && (
        <div className="guest-rsvp-sheet__fields">
          <input
            type="text"
            placeholder={t('public.rsvp.namePlaceholder')}
            value={openRsvpName}
            onChange={(e) => setOpenRsvpName(e.target.value)}
            maxLength={100}
            autoComplete="name"
          />
          {setOpenRsvpPhone && (
            <input
              type="tel"
              placeholder={t('public.rsvp.phonePlaceholder')}
              value={openRsvpPhone ?? ''}
              onChange={(e) => setOpenRsvpPhone(e.target.value)}
              maxLength={20}
              autoComplete="tel"
              inputMode="tel"
            />
          )}
        </div>
      )}
      <input
        ref={rsvpWebsiteRef}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="sr-only"
        aria-hidden="true"
        defaultValue=""
      />
      <CaptchaWidget onTokenChange={onCaptchaTokenChange} />
      <div className="guest-rsvp-sheet__actions">
        {actionButtons}
      </div>
      <button
        type="button"
        className="guest-rsvp-sheet__toggle"
        onClick={() => setShowOptional((v) => !v)}
        aria-expanded={showOptional}
      >
        {showOptional ? '−' : '+'} {t('public.rsvp.optionalToggle')}
      </button>
      {showOptional && (
        <div className="guest-rsvp-sheet__optional">
          <input
            type="text"
            placeholder={t('public.rsvp.dietaryPlaceholder')}
            value={rsvpDietary}
            onChange={(e) => setRsvpDietary(e.target.value)}
            maxLength={500}
          />
          <textarea
            placeholder={t('public.rsvp.messagePlaceholder')}
            value={rsvpMessage}
            onChange={(e) => setRsvpMessage(e.target.value)}
            maxLength={1000}
            rows={2}
          />
        </div>
      )}
    </GuestBottomSheet>
  );
}
