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
    dietaryPlaceholder: 'Пожелания по еде (необязательно)',
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
    dietaryPlaceholder: 'Тамаққа қатысты тілек (міндетті емес)',
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
  const [dietary, setDietary] = useState('');

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
   * Everywhere else: whatever the host set in the inspector. That checkbox
   * existed and was saved on the element, and this view ignored it — so a
   * host who turned the companion question off still got '+1' answers.
   */
  const showPlusOneChoice = isTokenMode
    ? !guestState.loading && guestState.error === null && guestState.hasPlusOne
    : el.askPlusOne !== false;

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
          dietaryRestrictions: dietary.trim() || undefined,
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
  // Input and option surfaces. Derived from the ink so the form sits inside
  // the template's palette; a literal white was correct only on white pages.
  const fieldBg = withAlpha(textColor, 0.035);

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
      {/*
        `title: ''` is how a template says "I write my own heading for this
        block". The widget honoured that for the title and then printed its own
        subtitle anyway, so «Інжу» stacked four lines over one form: the
        section head, the section lead, the widget title and the widget
        subtitle. The exception is the "you already answered" notice, which is
        state the template cannot know about.
      */}
      {el.title !== '' || (isTokenMode && guestState.loading === false && guestState.error === null && guestState.alreadyResponded) ? (
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16, textAlign: 'center' }}>
          {isTokenMode && !guestState.loading && guestState.error === null && guestState.alreadyResponded
            ? t.alreadyResponded
            : t.subtitle}
        </div>
      ) : null}

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
                  background: fieldBg,
                  fontFamily,
                  fontSize: 16,
                  color: textColor,
                  textAlign: 'center',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              {/*
                The phone is not optional on this path, whatever `askPhone`
                says.

                Open RSVP identifies a guest by their number: /api/rsvp/open
                validates it, dedupes on it, and the owner's reminders are sent
                to it. The endpoint rejects a request without one. Meanwhile the
                template kit sets `askPhone: false` on every RSVP block it
                builds, so the field was not drawn — and the submit handler
                below still demanded a non-empty phone. A guest typed their
                name, pressed «Жіберу» and got "fill in name and phone" with no
                phone field on the screen, for ever. `askPhone` is honoured
                where it is meaningful: on a personal link the guest is already
                identified and no fields are drawn at all.
              */}
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
                  background: fieldBg,
                  fontFamily,
                  fontSize: 16,
                  color: textColor,
                  textAlign: 'center',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              {el.askDietary ? (
                <input
                  type="text"
                  placeholder={t.dietaryPlaceholder}
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  style={{
                    height: 52,
                    padding: '0 20px',
                    borderRadius: 999,
                    border: `1.5px solid ${fieldBorder}`,
                    background: fieldBg,
                    fontFamily,
                    fontSize: 16,
                    color: textColor,
                    textAlign: 'center',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              ) : null}
            </>
          )}
          {/*
            Attendance options, stacked full width.

            They used to sit in a wrapping flex row: three pills sharing 330px,
            each `flex: 1`, each holding a Kazakh phrase up to 26 characters.
            «Серіктесіммен келемін» does not fit in 110px, so the row wrapped
            mid-label and the three options overlapped each other — which is
            what shipped, and what the owner saw. A vertical stack cannot
            overflow no matter how long the translation is, and it is also the
            shape every reference invitation uses for this question.

            The three buttons were also three copies of the same twenty style
            properties, so a change to one silently drifted from the others.
            One array, one renderer.
          */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(
              [
                ['attending', t.attending],
                ...(showPlusOneChoice
                  ? ([['attending_plus_one', t.attendingPlusOne]] as const)
                  : []),
                ['not_attending', t.notAttending],
              ] as ReadonlyArray<readonly [typeof status, string]>
            ).map(([value, labelText]) => {
              const on = status === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  aria-pressed={on}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    minHeight: 54,
                    padding: '0 20px',
                    borderRadius: 999,
                    border: `1px solid ${on ? btnColor : fieldBorder}`,
                    backgroundColor: on ? withAlpha(btnColor, 0.07) : fieldBg,
                    fontFamily,
                    fontSize: 15,
                    color: textColor,
                    fontWeight: on ? 600 : 400,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background .18s ease, border-color .18s ease',
                  }}
                >
                  {/* A real radio mark: the previous version signalled the
                      choice with a 2px border and an 8% tint, which on a cream
                      page is close to invisible. */}
                  <span
                    aria-hidden
                    style={{
                      flex: '0 0 auto',
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      border: `1.5px solid ${on ? btnColor : fieldBorder}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {on ? (
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 999,
                          backgroundColor: btnColor,
                        }}
                      />
                    ) : null}
                  </span>
                  <span>{labelText}</span>
                </button>
              );
            })}
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
