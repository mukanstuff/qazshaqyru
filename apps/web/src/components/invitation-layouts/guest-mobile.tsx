'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Music, Share2, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { ShareChannel } from './types';

export const GUEST_ENVELOPE_KEY = (slug: string) => `qazshaqyru:envelope:${slug}`;

export function hasSeenEnvelope(slug: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(GUEST_ENVELOPE_KEY(slug)) === '1';
  } catch {
    return true;
  }
}

export function markEnvelopeSeen(slug: string): void {
  try {
    window.localStorage.setItem(GUEST_ENVELOPE_KEY(slug), '1');
  } catch {
    /* non-critical */
  }
}

interface GuestEnvelopeIntroProps {
  slug: string;
  title: string;
  accent?: string;
  disabled?: boolean;
}

function shouldShowEnvelope(slug: string, disabled: boolean): boolean {
  if (disabled || slug === 'demo') return false;
  return !hasSeenEnvelope(slug);
}

export { shouldShowEnvelope };

export function GuestEnvelopeIntro({
  slug,
  title,
  accent = '#C4985A',
  disabled = false,
}: GuestEnvelopeIntroProps) {
  const { t, locale } = useI18n();
  const [visible, setVisible] = useState(() => shouldShowEnvelope(slug, disabled));
  const [opening, setOpening] = useState(false);
  const openLabel = locale === 'kz' ? 'Ашу' : 'Открыть приглашение';
  const inviteLabel = locale === 'kz' ? 'Шақыру' : 'Приглашение';

  useEffect(() => {
    setVisible(shouldShowEnvelope(slug, disabled));
  }, [slug, disabled]);

  const dismiss = useCallback(() => {
    setOpening(true);
    markEnvelopeSeen(slug);
    window.dispatchEvent(new Event('qazshaqyru:envelope-open'));
    window.setTimeout(() => setVisible(false), 720);
  }, [slug]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      className={`guest-envelope${opening ? ' guest-envelope--opening' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={openLabel}
      onClick={dismiss}
      style={{ '--inv-accent': accent } as React.CSSProperties}
    >
      <div className="guest-envelope__panel" onClick={(e) => e.stopPropagation()}>
        <div className="guest-envelope__flap" aria-hidden />
        <div className="guest-envelope__body">
          <span className="text-2xl" aria-hidden style={{ color: accent }}>
            ✦
          </span>
          <p>{title}</p>
          <span className="guest-envelope__seal">{inviteLabel}</span>
        </div>
        <button type="button" className="guest-envelope__cta" onClick={dismiss}>
          {openLabel}
        </button>
      </div>
    </div>
  );
}

interface GuestBottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function GuestBottomSheet({
  open,
  onClose,
  children,
  className,
  'data-testid': testId,
}: GuestBottomSheetProps) {
  if (!open) return null;

  return (
    <div
      className="guest-sheet__backdrop"
      onClick={onClose}
      data-testid={testId ? `${testId}-backdrop` : undefined}
    >
      <div
        className={['guest-sheet__panel', className].filter(Boolean).join(' ')}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        data-testid={testId}
      >
        <div className="guest-sheet__handle" aria-hidden />
        {children}
      </div>
    </div>
  );
}

interface GuestRsvpStickyBarProps {
  onOpenRSVP: () => void;
  accent: string;
  textDark?: string;
  label: string;
  visible: boolean;
}

export function GuestRsvpStickyBar({
  onOpenRSVP,
  accent,
  label,
  visible,
}: GuestRsvpStickyBarProps) {
  if (!visible) return null;

  return (
    <div className="guest-rsvp-sticky" data-testid="guest-rsvp-sticky" style={{ '--inv-accent': accent } as React.CSSProperties}>
      <button type="button" onClick={onOpenRSVP}>
        {label}
      </button>
    </div>
  );
}

interface GuestFloatingActionsProps {
  musicUrl?: string | null;
  isPlaying: boolean;
  onToggleMusic: () => void;
  hasInteracted: boolean;
  showShareMenu: boolean;
  onToggleShare: () => void;
  onShare: (type: ShareChannel) => void;
  copied: boolean;
  accent: string;
  variant?: 'default' | 'kazakh';
}

export function GuestFloatingActions({
  musicUrl,
  isPlaying,
  onToggleMusic,
  hasInteracted,
  showShareMenu,
  onToggleShare,
  onShare,
  copied,
  accent,
  variant = 'default',
}: GuestFloatingActionsProps) {
  const { t } = useI18n();
  const fabGroupClass = [
    'guest-fab-group',
    variant === 'kazakh' ? 'guest-fab-group--kazakh' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const fabStyle = { '--inv-accent': accent } as React.CSSProperties;

  if (variant === 'kazakh') {
    return (
      <div className={fabGroupClass} style={fabStyle}>
        {musicUrl && (
          <button
            type="button"
            className={`guest-fab${isPlaying ? ' guest-fab--playing' : ''}`}
            onClick={onToggleMusic}
            aria-label={isPlaying ? t('public.music.off') : t('public.music.on')}
          >
            <Music size={20} />
          </button>
        )}
        <button
          type="button"
          className="guest-fab"
          onClick={onToggleShare}
          aria-label={t('public.share.title')}
          aria-expanded={showShareMenu}
        >
          {showShareMenu ? <X size={20} /> : <Share2 size={20} />}
        </button>
        {showShareMenu && (
          <div className="guest-share-menu" role="menu">
            <button type="button" onClick={() => onShare('whatsapp')} role="menuitem">
              <span className="guest-share-menu__icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" /></svg>
              </span>
              WhatsApp
            </button>
            <button type="button" onClick={() => onShare('copy')} role="menuitem">
              <span className="guest-share-menu__icon guest-share-menu__icon--muted" aria-hidden>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </span>
              {copied ? t('public.share.copied') : t('public.share.copy')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={fabGroupClass} style={fabStyle}>
      <button
        type="button"
        className="guest-fab"
        onClick={onToggleShare}
        aria-label={t('public.share.title')}
        aria-expanded={showShareMenu}
      >
        {showShareMenu ? <X size={20} /> : <Share2 size={20} />}
      </button>

      {musicUrl && hasInteracted && (
        <button
          type="button"
          className={`guest-fab${isPlaying ? ' guest-fab--playing' : ''}`}
          onClick={onToggleMusic}
          aria-label={isPlaying ? t('public.music.off') : t('public.music.on')}
        >
          <Music size={20} />
        </button>
      )}

      {showShareMenu && (
        <div className="guest-share-menu" role="menu">
          <button type="button" onClick={() => onShare('whatsapp')} role="menuitem">
            <span className="guest-share-menu__icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
              </svg>
            </span>
            WhatsApp
          </button>
          <button type="button" onClick={() => onShare('telegram')} role="menuitem">
            <span className="guest-share-menu__icon" aria-hidden>TG</span>
            Telegram
          </button>
          <button type="button" onClick={() => onShare('copy')} role="menuitem">
            <span className="guest-share-menu__icon guest-share-menu__icon--muted" aria-hidden>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </span>
            {copied ? t('public.share.copied') : t('public.share.copy')}
          </button>
        </div>
      )}
    </div>
  );
}
