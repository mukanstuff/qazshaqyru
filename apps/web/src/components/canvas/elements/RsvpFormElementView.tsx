'use client';

import { useEffect, useState } from 'react';
import type { RsvpFormElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

interface Props {
  el: RsvpFormElement;
  shareUrl?: string;
  mode?: 'editor' | 'guest';
  locale?: 'ru' | 'kz';
  /** Personal guest link token (?guest=...). When present, RSVP is
   *  identified by token instead of asking for name/phone. */
  guestToken?: string | null;
  /**
   * Whether answering from the plain public link is allowed for this
   * invitation. Off by default for wedding / той / беташар / қыз ұзату /
   * сүндет той / тұсаукесер, which are meant to use personal links.
   *
   * The form used to render regardless: a guest at a wedding filled in name
   * and phone, pressed send, and got "Ответ по общей ссылке отключён" — with
   * no personal links existing either, because the UI that issues them had
   * been deleted. Nobody could RSVP to a wedding at all.
   */
  openRsvp?: boolean;
}

const LABELS = {
  ru: {
    titleFallback: 'Подтвердите присутствие',
    subtitle: 'Пожалуйста, ответьте до мероприятия',
    success: '✓ Рахмет! Ваш ответ сохранён.',
    namePlaceholder: 'Ваше имя',
    phonePlaceholder: 'Номер телефона (+7...)',
    attending: 'Приду',
    attendingPlusOne: 'Приду с гостем',
    notAttending: 'Не смогу',
    errorMissingFields: 'Заполните имя и телефон',
    errorSubmit: 'Ошибка отправки',
    errorSubmitFallback: 'Ошибка отправки RSVP',
    submit: 'Отправить',
    submitting: 'Отправка...',
    loading: 'Загрузка…',
    whatsappReply: 'Ответить через WhatsApp',
    whatsappMessage: 'Здравствуйте! Отвечаю на приглашение{name}.',
    greeting: 'Здравствуйте, {name}!',
    alreadyResponded: 'Вы уже ответили — можно изменить ответ.',
    guestNotFound: 'Ссылка недействительна. Обратитесь к организатору.',
    invitationNotAvailable: 'Приглашение недоступно.',
    personalLinkOnly: 'Ответы принимаются по личной ссылке.',
    personalLinkOnlyHint: 'Организатор отправит вам персональную ссылку — по ней имя подставится автоматически.',
    eventPassed: 'Мероприятие уже прошло.',
  },
  kz: {
    titleFallback: 'Қатысуыңызды растаңыз',
    subtitle: 'Шараға дейін жауап беріңіз',
    success: '✓ Рахмет! Жауабыңыз сақталды.',
    namePlaceholder: 'Атыңыз',
    phonePlaceholder: 'Телефон нөмірі (+7...)',
    attending: 'Келемін',
    attendingPlusOne: 'Серіктесіммен келемін',
    notAttending: 'Келе алмаймын',
    errorMissingFields: 'Атыңыз бен телефонды толтырыңыз',
    errorSubmit: 'Жіберу қатесі',
    errorSubmitFallback: 'RSVP жіберу қатесі',
    submit: 'Жіберу',
    submitting: 'Жіберілуде...',
    loading: 'Жүктелуде…',
    whatsappReply: 'WhatsApp арқылы жауап беру',
    whatsappMessage: 'Сәлеметсіз бе! Шақыруға жауап беремін{name}.',
    greeting: 'Сәлеметсіз бе, {name}!',
    alreadyResponded: 'Сіз бұрын жауап бердіңіз — оны өзгертуге болады.',
    guestNotFound: 'Сілтеме жарамсыз. Ұйымдастырушыға хабарласыңыз.',
    invitationNotAvailable: 'Шақыру қолжетімсіз.',
    personalLinkOnly: 'Жауаптар жеке сілтеме арқылы қабылданады.',
    personalLinkOnlyHint: 'Ұйымдастырушы сізге жеке сілтеме жібереді — онда есіміңіз автоматты қойылады.',
    eventPassed: 'Іс-шара өтіп кетті.',
  },
} as const;

/**
 * Lets the guest action bar know the reply landed, so its "Ответить" button
 * turns into "Ответ отправлен" instead of continuing to point at a form the
 * guest has already filled in.
 */
function notifyAnswered() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('qazshaqyru:rsvp-answered'));
}

type RsvpChoice = 'attending' | 'attending_plus_one' | 'not_attending';

/**
 * Blend a hex colour to an rgba string. Used so the form's hairlines follow
 * the template's accent instead of a hardcoded burgundy.
 */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function RsvpFormElementView({
  el,
  shareUrl,
  mode = 'guest',
  locale = 'ru',
  guestToken,
  openRsvp = true,
}: Props) {
  const t = LABELS[locale];
  const isTokenMode = mode === 'guest' && !!guestToken;
  // A guest on the plain public link when this invitation only accepts personal
  // links. Showing them a form that is guaranteed to 403 is worse than telling
  // them what to expect. The editor preview always shows the full form.
  const personalLinkOnly = mode === 'guest' && !isTokenMode && !openRsvp;

  // ── Open-RSVP (no token): ask for name + phone ──────────────────────────
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // ── Token mode: resolve guest identity first ────────────────────────────
  const [guestState, setGuestState] = useState<
    | { loading: true }
    | { loading: false; error: string }
    | { loading: false; error: null; guestName: string; hasPlusOne: boolean; alreadyResponded: boolean }
  >(
    isTokenMode
      ? { loading: true }
      : { loading: false, error: null, guestName: '', hasPlusOne: false, alreadyResponded: false }
  );

  /*
   * Whether to offer "I'll come with a companion".
   *
   * Token mode: only when the owner's guest list says this guest has one.
   * Everywhere else (open RSVP, and the editor preview): always, because
   * nobody has decided for them.
   */
  const showPlusOneChoice = isTokenMode
    ? !guestState.loading && guestState.error === null && guestState.hasPlusOne
    : true;

  useEffect(() => {
    if (!isTokenMode || !guestToken) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/rsvp?guestToken=${encodeURIComponent(guestToken)}`);
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          const code = (data as { error?: string }).error;
          const msg =
            code === 'guest_not_found'
              ? t.guestNotFound
              : code === 'invitation_not_available'
              ? t.invitationNotAvailable
              : code === 'event_passed'
              ? t.eventPassed
              : t.errorSubmitFallback;
          setGuestState({ loading: false, error: msg });
          return;
        }
        setGuestState({
          loading: false,
          error: null,
          guestName: data.guest?.name ?? '',
          hasPlusOne: !!data.guest?.hasPlusOne,
          alreadyResponded: !!data.response,
        });
        const existingStatus = data.response?.status as RsvpChoice | undefined;
        if (existingStatus) setStatus(existingStatus);
      } catch {
        if (alive) setGuestState({ loading: false, error: t.errorSubmitFallback });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTokenMode, guestToken]);

  const [status, setStatus] = useState<RsvpChoice>('attending');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const slug = shareUrl ? shareUrl.split('/i/')[1]?.split('/')[0] : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'editor') {
      setSubmitted(true);
      return;
    }
    setError('');

    if (isTokenMode) {
      if (!guestToken) return;
      setLoading(true);
      try {
        const res = await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestToken, status }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || t.errorSubmit);
        }
        setSubmitted(true);
        notifyAnswered();
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorSubmitFallback);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!slug || !name.trim() || !phone.trim()) {
      setError(t.errorMissingFields);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/rsvp/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          phone: phone.trim(),
          // Was `status === 'attending_plus_one' ? 'attending' : status` — the
          // form showed "Приду с гостем" and then threw the companion away on
          // the way to the server, so the guest count the venue gets was short
          // by one person for every couple that answered from the public page.
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t.errorSubmit);
      }
      setSubmitted(true);
      notifyAnswered();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorSubmitFallback);
    } finally {
      setLoading(false);
    }
  };

  const fontFamily = fontStack(el.fontFamily);
  const bgColor = el.bgColor || '#ffffff';
  const textColor = el.textColor || '#2c1810';
  const btnColor = el.accentColor || '#6b1d3a';
  const btnTextColor = '#ffffff';

  // A template that sets a transparent background wants the form to sit *on*
  // the page, not float above it as a card. The shadow and the hairline are
  // therefore dropped in that case rather than being drawn over the artwork.
  // The border tint follows the element's accent instead of the hardcoded
  // burgundy it used to carry, which fought every palette but the original.
  const isTransparent = bgColor === 'transparent';
  const boxStyle = {
    fontFamily,
    backgroundColor: bgColor,
    color: textColor,
    padding: isTransparent ? 0 : 16,
    borderRadius: isTransparent ? 0 : 12,
    boxShadow: isTransparent ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
    border: isTransparent ? 'none' : `1px solid ${withAlpha(btnColor, 0.18)}`,
    width: '100%',
    boxSizing: 'border-box' as const,
  };
  const fieldBorder = withAlpha(btnColor, 0.35);

  if (isTokenMode && guestState.loading) {
    return (
      <div style={{ ...boxStyle, textAlign: 'center', opacity: 0.7 }}>{t.loading}</div>
    );
  }

  if (isTokenMode && !guestState.loading && guestState.error) {
    return (
      <div style={boxStyle}>
        <div style={{ fontSize: 14, textAlign: 'center' }}>{guestState.error}</div>
      </div>
    );
  }

  return (
    <div style={boxStyle}>
      {/* Empty title = the template supplies its own heading above. */}
      {el.title !== '' && (
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>
          {el.title || t.titleFallback}
        </div>
      )}
      {isTokenMode && !guestState.loading && guestState.error === null ? (
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>
          {t.greeting.replace('{name}', guestState.guestName)}
        </div>
      ) : null}
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16, textAlign: 'center' }}>
        {isTokenMode && !guestState.loading && guestState.error === null && guestState.alreadyResponded
          ? t.alreadyResponded
          : t.subtitle}
      </div>

      {personalLinkOnly ? (
        // This branch explains why there is no form, which makes it a notice,
        // not a headline. It was set larger and bolder than the section's own
        // heading, so on the catalogue preview the loudest words on the screen
        // were an apology about personal links.
        <div style={{ textAlign: 'center', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: textColor, opacity: 0.92 }}>
            {t.personalLinkOnly}
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.7, color: textColor, lineHeight: 1.5 }}>
            {t.personalLinkOnlyHint}
          </div>
        </div>
      ) : submitted ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#2d6a4f', fontWeight: 600 }}>
          {t.success}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!isTokenMode && (
            <>
              <input
                type="text"
                placeholder={t.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  height: 52,
                  padding: '0 20px',
                  borderRadius: 999,
                  border: `1.5px solid ${fieldBorder}`,
                  background: 'rgba(255,255,255,0.72)',
                  fontFamily,
                  fontSize: 16,
                  color: textColor,
                  textAlign: 'center',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <input
                type="tel"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  height: 52,
                  padding: '0 20px',
                  borderRadius: 999,
                  border: `1.5px solid ${fieldBorder}`,
                  background: 'rgba(255,255,255,0.72)',
                  fontFamily,
                  fontSize: 16,
                  color: textColor,
                  textAlign: 'center',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStatus('attending')}
              style={{
                flex: 1,
                minHeight: 52,
                padding: '0 10px',
                borderRadius: 999,
                border: status === 'attending' ? `2px solid ${btnColor}` : `1px solid ${fieldBorder}`,
                backgroundColor: status === 'attending' ? withAlpha(btnColor, 0.08) : 'transparent',
                fontFamily,
                fontSize: 15,
                color: textColor,
                fontWeight: status === 'attending' ? 600 : 400,
                cursor: 'pointer',
                transition: 'background .18s ease, border-color .18s ease',
              }}
            >
              {t.attending}
            </button>
            {/*
              Who gets to say "with a companion".

              With a personal link, the owner already decided: the button shows
              only for guests they marked as bringing someone. Answering from
              the public page there is no such decision on file, so hiding the
              button meant a couple could only register as one person — and the
              server, which accepts a plus-one from open RSVP, never heard about
              the second. Under-counting a banquet is worse than over-counting:
              the owner can edit a guest, but nobody can seat a person the venue
              was never told about.
            */}
            {showPlusOneChoice ? (
              <button
                type="button"
                onClick={() => setStatus('attending_plus_one')}
                style={{
                  flex: 1,
                  minHeight: 52,
                  padding: '0 10px',
                  borderRadius: 999,
                  border: status === 'attending_plus_one' ? `2px solid ${btnColor}` : `1px solid ${fieldBorder}`,
                  backgroundColor: status === 'attending_plus_one' ? withAlpha(btnColor, 0.08) : 'transparent',
                  fontFamily,
                  fontSize: 15,
                  color: textColor,
                  fontWeight: status === 'attending_plus_one' ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'background .18s ease, border-color .18s ease',
                }}
              >
                {t.attendingPlusOne}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setStatus('not_attending')}
              style={{
                flex: 1,
                minHeight: 52,
                padding: '0 10px',
                borderRadius: 999,
                border: status === 'not_attending' ? `2px solid ${btnColor}` : `1px solid ${fieldBorder}`,
                backgroundColor: status === 'not_attending' ? withAlpha(btnColor, 0.08) : 'transparent',
                fontFamily,
                fontSize: 15,
                color: textColor,
                fontWeight: status === 'not_attending' ? 600 : 400,
                cursor: 'pointer',
                transition: 'background .18s ease, border-color .18s ease',
              }}
            >
              {t.notAttending}
            </button>
          </div>
          {error && <div style={{ color: '#b42318', fontSize: 12 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: btnColor,
              color: btnTextColor,
              minHeight: 54,
              padding: '0 24px',
              borderRadius: 999,
              border: 'none',
              fontFamily,
              fontSize: 17,
              fontWeight: 500,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              marginTop: 10,
              boxShadow: `0 14px 28px -16px ${withAlpha(btnColor, 0.7)}`,
              transition: 'transform .2s ease, box-shadow .2s ease',
            }}
          >
            {loading ? t.submitting : t.submit}
          </button>
        </form>
      )}
      {el.whatsappPhone ? (
        <WhatsappReplyLink
          phone={el.whatsappPhone}
          guestName={
            isTokenMode && !guestState.loading && guestState.error === null
              ? guestState.guestName
              : name
          }
          label={t.whatsappReply}
          messageTemplate={t.whatsappMessage}
        />
      ) : null}
    </div>
  );
}

function WhatsappReplyLink({
  phone,
  guestName,
  label,
  messageTemplate,
}: {
  phone: string;
  guestName: string;
  label: string;
  messageTemplate: string;
}) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const namePart = guestName.trim() ? ` (${guestName.trim()})` : '';
  const text = messageTemplate.replace('{name}', namePart);
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        textAlign: 'center',
        marginTop: 10,
        padding: '10px 0',
        borderRadius: 999,
        border: '1px solid #25D366',
        color: '#128C7E',
        fontWeight: 600,
        fontSize: 14,
        textDecoration: 'none',
      }}
    >
      {label}
    </a>
  );
}
