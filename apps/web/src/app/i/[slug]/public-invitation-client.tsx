'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Loader2,
  Heart,
  MapPin,
  Calendar,
  Clock,
  Users,
  ChevronDown,
  Check,
  X,
  Music,
  Sparkles,
  ArrowRight,
  Share2,
  Copy,
  PartyPopper,
} from 'lucide-react';
import { useI18n } from '@/i18n';

interface Invitation {
  id: string;
  slug: string;
  title: string;
  eventType: string;
  eventDate: string;
  eventTime?: string | null;
  eventPlace?: string | null;
  eventTimezone: string;
  templateKey: string;
  templateData: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    backgroundImage?: string;
  };
  musicUrl?: string | null;
  mapUrl?: string | null;
  address?: string | null;
  customText?: Record<string, unknown>;
  language: 'kz' | 'ru';
  hostName?: string | null;
  isPast: boolean;
}

interface RSVPData {
  guest: { id: string; name: string; hasPlusOne: boolean; plusOneName?: string | null };
  invitation: {
    title: string;
    slug: string;
    eventDate: string;
    eventTime?: string | null;
    eventPlace?: string | null;
    eventTimezone: string;
    language: 'kz' | 'ru';
    hostName?: string | null;
    isActive: boolean;
  };
  response?: { status: string; message?: string | null; dietaryRestrictions?: string | null } | null;
}

const TEMPLATES: Record<
  string,
  {
    name: string;
    gradient: string;
    accent: string;
    accentLight: string;
    textMuted: string;
    bgSection: string;
    cardBg: string;
    unsplash: string;
    unsplashOverlay: string;
  }
> = {
  classic: {
    name: 'Классика',
    gradient: 'from-stone-800 via-stone-700 to-stone-900',
    accent: '#c9a96e',
    accentLight: 'rgba(201,169,110,0.12)',
    textMuted: 'text-stone-400',
    bgSection: 'bg-stone-50',
    cardBg: 'bg-white',
    unsplash: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',
    unsplashOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.55) 100%)',
  },
  elegant: {
    name: 'Элегантный',
    gradient: 'from-slate-800 via-indigo-900 to-slate-900',
    accent: '#a78bfa',
    accentLight: 'rgba(167,139,250,0.12)',
    textMuted: 'text-slate-400',
    bgSection: 'bg-slate-50',
    cardBg: 'bg-white',
    unsplash: 'https://images.unsplash.com/photo-1519225425429-c6f1f6b9a8c4?w=1920&q=80',
    unsplashOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.6) 100%)',
  },
  golden: {
    name: 'Золотой',
    gradient: 'from-amber-900 via-yellow-900 to-amber-950',
    accent: '#fbbf24',
    accentLight: 'rgba(251,191,36,0.12)',
    textMuted: 'text-amber-300',
    bgSection: 'bg-amber-50',
    cardBg: 'bg-white',
    unsplash: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1920&q=80',
    unsplashOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.5) 100%)',
  },
  nature: {
    name: 'Природа',
    gradient: 'from-emerald-900 via-teal-900 to-green-950',
    accent: '#34d399',
    accentLight: 'rgba(52,211,153,0.12)',
    textMuted: 'text-emerald-300',
    bgSection: 'bg-emerald-50',
    cardBg: 'bg-white',
    unsplash: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1920&q=80',
    unsplashOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.55) 100%)',
  },
  romantic: {
    name: 'Романтика',
    gradient: 'from-rose-900 via-pink-900 to-rose-950',
    accent: '#fb7185',
    accentLight: 'rgba(251,113,133,0.12)',
    textMuted: 'text-rose-300',
    bgSection: 'bg-rose-50',
    cardBg: 'bg-white',
    unsplash: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1920&q=80',
    unsplashOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.55) 100%)',
  },
  modern: {
    name: 'Современный',
    gradient: 'from-zinc-900 via-neutral-900 to-stone-950',
    accent: '#e4e4e7',
    accentLight: 'rgba(228,228,231,0.1)',
    textMuted: 'text-zinc-400',
    bgSection: 'bg-zinc-50',
    cardBg: 'bg-white',
    unsplash: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=1920&q=80',
    unsplashOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.6) 100%)',
  },
};

interface CountdownProps {
  targetDate: Date;
  labels: { days: string; hours: string; minutes: string; seconds: string };
}

const Countdown = React.memo(function Countdown({ targetDate, labels }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [
    { value: timeLeft.days, label: labels.days },
    { value: timeLeft.hours, label: labels.hours },
    { value: timeLeft.minutes, label: labels.minutes },
    { value: timeLeft.seconds, label: labels.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-4">
      {units.map((unit, i) => (
        <div key={i} className="text-center">
          <div
            className="w-12 h-14 rounded-lg flex items-center justify-center text-lg font-medium"
            style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}
          >
            {String(unit.value).padStart(2, '0')}
          </div>
          <p className="text-white/40 text-[10px] mt-1 uppercase tracking-wider">{unit.label}</p>
        </div>
      ))}
    </div>
  );
});

import React from 'react';

interface Props {
  slug: string;
  guestToken: string | null;
  initialUserAgent: string;
}

export default function PublicInvitationClient({ slug, guestToken }: Props) {
  const { t } = useI18n();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [rsvpData, setRsvpData] = useState<RSVPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRSVP, setShowRSVP] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Persist the guest token in localStorage keyed by invitation slug. The
  // server no longer echoes the token in API responses, so we keep the
  // value we received in the URL. If the user navigates away and back,
  // we still have it.
  const tokenStorageKey = useMemo(() => `invito:guestToken:${slug}`, [slug]);
  const musicDecisionKey = useMemo(() => `invito:music:${slug}`, [slug]);

  const getStoredToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    if (guestToken) return guestToken;
    try {
      return window.localStorage.getItem(tokenStorageKey);
    } catch {
      return null;
    }
  }, [guestToken, tokenStorageKey]);

  useEffect(() => {
    if (guestToken && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(tokenStorageKey, guestToken);
      } catch {
        // localStorage may be disabled (private mode, quota); fall back
        // to URL-only - the RSVP modal will just be less sticky.
      }
    }
  }, [guestToken, tokenStorageKey]);

  useEffect(() => {
    loadInvitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!invitation) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [invitation]);

  const loadInvitation = async () => {
    try {
      const res = await fetch(`/api/invitations/public/${slug}`);
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === 'not_found'
            ? t('public.errors.notFound')
            : t('public.errors.notAvailable')
        );
        setLoading(false);
        return;
      }
      setInvitation(data.invitation);
      if (guestToken) {
        try {
          const rsvpRes = await fetch(`/api/rsvp?guestToken=${encodeURIComponent(guestToken)}`);
          if (rsvpRes.ok) {
            const r = await rsvpRes.json();
            setRsvpData(r);
            if (r.response?.status && r.response.status !== 'pending') {
              setRsvpStatus(r.response.status);
            }
          }
        } catch {
          // ignore
        }
      }
    } catch {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying((p) => !p);
  }, [isPlaying]);

  const handleMusicInteraction = useCallback(() => {
    if (!invitation?.musicUrl || hasInteracted) {
      setHasInteracted(true);
      return;
    }
    setHasInteracted(true);
    // Only show the prompt the first time, and respect a previous
    // accept/decline stored locally. Otherwise the modal pops up on
    // every page load, which is annoying.
    let decision: string | null = null;
    try {
      decision = window.localStorage.getItem(musicDecisionKey);
    } catch {
      // ignore
    }
    if (decision === 'on' && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      return;
    }
    if (decision !== 'off') {
      setShowMusicPrompt(true);
    }
  }, [invitation, hasInteracted, musicDecisionKey]);

  const handleRSVP = useCallback(
    async (status: string) => {
      const token = getStoredToken();
      if (!token) {
        setError(t('public.errors.notAvailable'));
        return;
      }
      setRsvpLoading(true);
      try {
        const res = await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestToken: token, status }),
        });
        if (res.ok) {
          setRsvpStatus(status);
          setShowRSVP(false);
          setRsvpData((prev) =>
            prev
              ? { ...prev, response: { ...(prev.response || {}), status } }
              : prev
          );
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.message || t('errors.generic'));
        }
      } catch {
        setError(t('errors.networkError'));
      } finally {
        setRsvpLoading(false);
      }
    },
    [getStoredToken, t]
  );

  const handleShare = useCallback(
    (type: 'whatsapp' | 'copy') => {
      const url = `${window.location.origin}/i/${slug}`;
      if (type === 'copy') {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        const text = invitation
          ? `Вас приглашают на ${invitation.title}!\n${url}`
          : url;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      }
      setShowShareMenu(false);
    },
    [slug, invitation]
  );

  const tpl = useMemo(
    () => (invitation ? TEMPLATES[invitation.templateKey] || TEMPLATES.classic : null),
    [invitation]
  );

  const eventDate = useMemo(
    () => (invitation ? new Date(invitation.eventDate) : null),
    [invitation]
  );

  const customText = (invitation?.customText || {}) as {
    greeting?: string;
    aboutCouple?: string;
    program?: Array<{ time: string; title: string; description?: string }>;
    footer?: string;
    dressCode?: string;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-6">
            <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-white/50 text-sm tracking-widest uppercase">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !invitation || !tpl || !eventDate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 border border-stone-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-7 h-7 text-stone-400" />
          </div>
          <h1 className="text-xl font-bold text-stone-800 mb-2">{error || t('errors.generic')}</h1>
          <p className="text-stone-500 text-sm">{t('public.errors.checkLink')}</p>
        </div>
      </div>
    );
  }

  const eventInfo = {
    label: t(`events.${invitation.eventType as 'wedding' | 'toy' | 'betashar' | 'kyz_uzatu' | 'birthday' | 'anniversary' | 'corporate' | 'other'}` as const),
  };
  const tz = invitation.eventTimezone || 'Asia/Almaty';
  const localeForDate = invitation.language === 'kz' ? 'kk-KZ' : 'ru-RU';

  const dateOptsLong: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  };
  const dateOptsShort: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  };

  const backgroundImage = invitation.templateData?.backgroundImage || tpl.unsplash;

  return (
    <div
      className="min-h-screen bg-white"
      onClick={handleMusicInteraction}
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', Georgia, serif !important; }
        .font-sans { font-family: 'DM Sans', system-ui, sans-serif !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-on-enter { opacity: 0; transform: translateY(28px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .animate-on-enter.visible { opacity: 1; transform: translateY(0); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }
      `}</style>

      {invitation.musicUrl && <audio ref={audioRef} src={invitation.musicUrl} loop preload="none" />}

      {showMusicPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full text-center shadow-2xl" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div
              className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${tpl.accent}, ${tpl.accent}dd)` }}
            >
              <Music className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">{t('public.music.title')}</h3>
            <p className="text-sm text-stone-500 mb-6">{t('public.music.description')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                  try {
                    window.localStorage.setItem(musicDecisionKey, 'on');
                  } catch {
                    // ignore
                  }
                  setShowMusicPrompt(false);
                }}
                className="flex-1 h-11 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #333 0%, #111 100%)' }}
              >
                {t('public.music.on')}
              </button>
              <button
                onClick={() => {
                  try {
                    window.localStorage.setItem(musicDecisionKey, 'off');
                  } catch {
                    // ignore
                  }
                  setShowMusicPrompt(false);
                }}
                className="flex-1 h-11 rounded-xl bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200"
              >
                {t('public.music.off')}
              </button>
            </div>
          </div>
        </div>
      )}

      {invitation.musicUrl && hasInteracted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMusic();
          }}
          aria-label={isPlaying ? t('public.music.on') : t('public.music.off')}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center transition-all hover:scale-105 border border-black/5"
          style={{ animation: 'fadeIn 0.5s ease' }}
        >
          <Music className="w-5 h-5" style={{ color: isPlaying ? tpl.accent : '#a8a29e' }} />
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowShareMenu((s) => !s);
        }}
        aria-label={t('public.share.title')}
        className="fixed bottom-6 z-50 w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center transition-all hover:scale-105 border border-black/5"
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      >
        {showShareMenu ? <X className="w-5 h-5 text-stone-500" /> : <Share2 className="w-5 h-5 text-stone-500" />}
      </button>

      {showShareMenu && (
        <div
          className="fixed bottom-24 z-50 bg-white rounded-2xl shadow-2xl p-2 min-w-[200px]"
          style={{ left: '50%', transform: 'translateX(-50%)', animation: 'fadeIn 0.2s ease' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleShare('whatsapp')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 text-left"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#25D366' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-stone-700">{t('public.share.whatsapp')}</span>
          </button>
          <button
            onClick={() => handleShare('copy')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-stone-500" />}
            </div>
            <span className="text-sm font-medium text-stone-700">
              {copied ? t('public.share.copied') : t('public.share.copy')}
            </span>
          </button>
        </div>
      )}

      {rsvpStatus && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-white rounded-full px-6 py-3 shadow-xl flex items-center gap-3 text-sm font-medium"
          style={{ animation: 'fadeUp 0.4s ease', border: `1px solid ${tpl.accent}40` }}
        >
          <Check className="w-4 h-4" style={{ color: tpl.accent }} />
          <span className="text-stone-700">
            {rsvpStatus === 'attending'
              ? t('public.rsvp.successAttending')
              : rsvpStatus === 'attending_plus_one'
                ? t('public.rsvp.successWithGuest')
                : t('public.rsvp.successNotAttending')}
          </span>
          <button onClick={() => setRsvpStatus(null)} className="text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showRSVP && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowRSVP(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            style={{ animation: 'fadeUp 0.35s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-8 sm:block hidden" />
            <div className="text-center mb-8">
              <Sparkles className="w-6 h-6 mx-auto mb-3" style={{ color: tpl.accent }} />
              <h3 className="text-xl font-bold text-stone-800">
                {rsvpData
                  ? t('public.rsvp.titleNamed', { name: rsvpData.guest.name })
                  : t('public.rsvp.title')}
              </h3>
              <p className="text-sm text-stone-500 mt-1">{t('public.rsvp.subtitle')}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleRSVP('attending')}
                disabled={rsvpLoading}
                className="w-full h-12 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #222 0%, #111 100%)' }}
              >
                {rsvpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {t('public.rsvp.attending')}
              </button>
              {rsvpData?.guest.hasPlusOne && (
                <button
                  onClick={() => handleRSVP('attending_plus_one')}
                  disabled={rsvpLoading}
                  className="w-full h-12 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${tpl.accent} 0%, ${tpl.accent}cc 100%)` }}
                >
                  {rsvpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {t('public.rsvp.attendingWithGuest')}
                </button>
              )}
              <button
                onClick={() => handleRSVP('not_attending')}
                disabled={rsvpLoading}
                className="w-full h-12 rounded-xl bg-stone-100 text-stone-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-stone-200 disabled:opacity-50"
              >
                {rsvpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                {t('public.rsvp.notAttending')}
              </button>
            </div>
            <button
              onClick={() => setShowRSVP(false)}
              className="w-full mt-4 py-3 text-sm text-stone-400 hover:text-stone-600"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      <section
        className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundImage: `url('${backgroundImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0" style={{ background: tpl.unsplashOverlay }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-10 text-center px-6 max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-8" style={{ animation: 'fadeIn 1s ease 0.3s both' }}>
            <div className="h-px w-12" style={{ background: tpl.accent }} />
            <span className="text-xs uppercase tracking-[0.25em]" style={{ color: tpl.accent }}>
              {tpl.name}
            </span>
            <div className="h-px w-12" style={{ background: tpl.accent }} />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: 'rgba(255,255,255,0.7)', animation: 'fadeUp 1s ease 0.5s both' }}>
            {eventInfo.label}
          </p>
          <h1
            className="font-serif text-5xl sm:text-7xl font-light text-white leading-[1.1] mb-6"
            style={{ animation: 'fadeUp 1s ease 0.7s both', fontFamily: "'Cormorant Garamond', serif" }}
          >
            {invitation.title}
          </h1>

          {!invitation.isPast && (
            <div className="mb-8" style={{ animation: 'fadeUp 1s ease 0.8s both' }}>
              <Countdown
                targetDate={eventDate}
                labels={{
                  days: t('public.countdown.days'),
                  hours: t('public.countdown.hours'),
                  minutes: t('public.countdown.minutes'),
                  seconds: t('public.countdown.seconds'),
                }}
              />
            </div>
          )}

          <div className="space-y-1 mb-10" style={{ animation: 'fadeUp 1s ease 0.9s both' }}>
            <p className="text-white/90 text-lg font-light">
              {new Intl.DateTimeFormat(localeForDate, dateOptsLong).format(eventDate)}
            </p>
            {invitation.eventTime && (
              <p className="text-white/60 text-sm flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {invitation.eventTime}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-4" style={{ animation: 'fadeIn 1s ease 1.1s both' }}>
            <div className="w-8 h-px bg-white/30" />
            <Heart className="w-4 h-4" style={{ fill: tpl.accent, color: tpl.accent }} />
            <div className="w-8 h-px bg-white/30" />
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ animation: 'fadeIn 1s ease 1.5s both' }}>
          <span className="text-white/40 text-xs tracking-widest uppercase">{t('public.scrollDown')}</span>
          <ChevronDown className="w-5 h-5 text-white/40 animate-bounce" />
        </div>
      </section>

      <section id="details" data-animate className={`py-24 px-6 ${tpl.bgSection}`}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-16 animate-on-enter visible" style={{ animationDelay: '0.1s' }}>
            <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: tpl.accent }}>
              {t('public.sections.dateAndPlace')}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-stone-800">{invitation.eventPlace || ''}</h2>
          </div>
          <div className={`${tpl.cardBg} rounded-2xl p-8 shadow-sm border border-stone-100/80 space-y-8`}>
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tpl.accentLight }}>
                <Calendar className="w-5 h-5" style={{ color: tpl.accent }} />
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">{t('public.details.date')}</p>
                <p className="text-stone-800 font-medium">
                  {new Intl.DateTimeFormat(localeForDate, dateOptsShort).format(eventDate)}
                </p>
              </div>
            </div>
            {invitation.eventTime && (
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tpl.accentLight }}>
                  <Clock className="w-5 h-5" style={{ color: tpl.accent }} />
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">{t('public.details.time')}</p>
                  <p className="text-stone-800 font-medium">{invitation.eventTime}</p>
                </div>
              </div>
            )}
            {invitation.address && (
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tpl.accentLight }}>
                  <MapPin className="w-5 h-5" style={{ color: tpl.accent }} />
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">{t('public.details.address')}</p>
                  <p className="text-stone-800 font-medium">{invitation.address}</p>
                </div>
              </div>
            )}
            {invitation.mapUrl && (
              <a
                href={invitation.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 text-sm text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-all group"
              >
                <MapPin className="w-4 h-4" style={{ color: tpl.accent }} />
                <span className="flex-1">{t('public.details.openOnMap')}</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </a>
            )}
          </div>
        </div>
      </section>

      {customText.greeting && (
        <section id="greeting" data-animate className="py-24 px-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-px w-8" style={{ background: tpl.accent }} />
                <Heart className="w-3.5 h-3.5" style={{ fill: tpl.accent, color: tpl.accent }} />
                <div className="h-px w-8" style={{ background: tpl.accent }} />
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-light text-stone-700 leading-relaxed">{customText.greeting}</p>
            </div>
          </div>
        </section>
      )}

      {customText.aboutCouple && (
        <section id="about" data-animate className={`py-24 px-6 ${tpl.bgSection}`}>
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.25em] mb-3" style={{ color: tpl.accent }}>
                {t('public.sections.about')}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-stone-800">{t('public.sections.aboutTitle')}</h2>
            </div>
            <div className={`${tpl.cardBg} rounded-2xl p-8 shadow-sm border border-stone-100/80 text-center`}>
              <p className="text-stone-600 leading-relaxed text-base">{customText.aboutCouple}</p>
            </div>
          </div>
        </section>
      )}

      {customText.program && customText.program.length > 0 && (
        <section id="program" data-animate className="py-24 px-6">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.25em] mb-3" style={{ color: tpl.accent }}>
                {t('public.sections.program')}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-stone-800">{t('public.sections.programTitle')}</h2>
            </div>
            <div className="space-y-3">
              {customText.program.map((item, index) => (
                <div
                  key={index}
                  className={`${tpl.cardBg} rounded-2xl p-5 shadow-sm border border-stone-100/80 flex items-start gap-5`}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-medium"
                    style={{ background: tpl.accentLight, color: tpl.accent }}
                  >
                    {item.time}
                  </div>
                  <div className="pt-1">
                    <p className="font-medium text-stone-800">{item.title}</p>
                    {item.description && <p className="text-sm text-stone-500 mt-0.5">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {customText.dressCode && (
        <section data-animate className={`py-16 px-6 ${tpl.bgSection}`}>
          <div className="max-w-lg mx-auto text-center">
            <Sparkles className="w-5 h-5 mx-auto mb-3" style={{ color: tpl.accent }} />
            <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: tpl.accent }}>
              {t('public.sections.dressCode')}
            </p>
            <p className="font-serif text-2xl text-stone-700">{customText.dressCode}</p>
          </div>
        </section>
      )}

      <section
        id="rsvp"
        className="py-24 px-6 text-center relative"
        style={{ backgroundImage: `url('${backgroundImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-10 bg-white/30" />
              <Heart className="w-4 h-4" style={{ fill: tpl.accent, color: tpl.accent }} />
              <div className="h-px w-10 bg-white/30" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white mb-4">{t('public.sections.rsvpCtaTitle')}</h2>
            <p className="text-white/60 text-sm">{t('public.sections.rsvpCtaSubtitle')}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRSVP(true);
            }}
            disabled={!rsvpData}
            className="inline-flex items-center gap-2 h-14 px-10 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #333 0%, #111 100%)', border: `1px solid ${tpl.accent}40` }}
          >
            <PartyPopper className="w-4 h-4" />
            {t('public.sections.rsvpCtaButton')}
          </button>
          {!rsvpData && (
            <p className="text-white/50 text-xs mt-4">{t('public.errors.checkLink')}</p>
          )}
        </div>
      </section>

      <footer className="py-12 px-6 text-center bg-stone-950">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-4 h-4" style={{ fill: tpl.accent, color: tpl.accent }} />
          </div>
          <p className="text-white/60 text-sm">{customText.footer || t('public.footer')}</p>
          <p className="text-white/20 text-xs mt-6 tracking-widest uppercase">Invito · 2026</p>
        </div>
      </footer>
    </div>
  );
}
