'use client';

import { useEffect, useMemo, useState } from 'react';
import type { WishesElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';
import {
  WISH_REACTION_DISPLAY,
  WISH_REACTION_EMOJIS,
  type WishReactionEmoji,
} from '@/lib/wishes/wish-reactions';

/**
 * The guest wishes wall.
 *
 * Rewritten rather than patched, because every part of its data path was wrong
 * and none of it had ever run:
 *
 *  - the invitation was read from `el.templateBindTo`, a field no template
 *    sets, so the id was always empty and both effects bailed out before
 *    fetching anything;
 *  - the request sent `invitationId`, while `/api/wishes` validates `slug` and
 *    rejects anything else with a 400;
 *  - reactions posted raw emoji ("❤️"), while the route accepts the named keys
 *    `heart | pray | celebrate | clap` and rejects the rest.
 *
 * The net effect on every published invitation was a wall that displayed one
 * hardcoded demo wish, saved nothing and reacted to nothing.
 *
 * The form is also collapsed behind a button now. Two large empty input boxes
 * were the default state of the section, which is the least invitation-like
 * thing on the page; both reference services show the wishes themselves and
 * open a form only when the guest asks for one.
 */

interface Wish {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
  reactions: Partial<Record<WishReactionEmoji, number>>;
  likeCount?: number;
  myReaction?: WishReactionEmoji | null;
}

interface Props {
  el: WishesElement;
  shareUrl?: string;
  mode?: 'editor' | 'guest';
  /**
   * The invitation's own language, not the UI's. This component had no locale
   * at all and wrote every label in Russian, so a Kazakh invitation carried a
   * Russian wishes wall in the middle of it.
   */
  locale?: 'ru' | 'kz';
  /** Published invitation slug — how /api/wishes addresses an invitation. */
  slug?: string;
}

const LABELS = {
  ru: {
    subtitle: 'Оставьте тёплое пожелание молодожёнам',
    open: 'Оставить пожелание',
    name: 'Ваше имя',
    text: 'Ваше пожелание…',
    send: 'Отправить',
    sending: 'Отправка…',
    cancel: 'Отмена',
    empty: 'Станьте первым, кто оставит пожелание',
    thanks: 'Спасибо! Ваше пожелание сохранено.',
  },
  kz: {
    subtitle: 'Жас жұбайларға жылы тілегіңізді қалдырыңыз',
    open: 'Тілек қалдыру',
    name: 'Атыңыз',
    text: 'Тілегіңіз…',
    send: 'Жіберу',
    sending: 'Жіберілуде…',
    cancel: 'Болдырмау',
    empty: 'Алғашқы тілекті сіз қалдырыңыз',
    thanks: 'Рақмет! Тілегіңіз сақталды.',
  },
} as const;

/** Two letters for the avatar disc, the way the reference cards do it. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string, locale: 'ru' | 'kz'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return locale === 'kz' ? `${dd}.${mm}.${d.getFullYear()}` : `${dd}.${mm}.${d.getFullYear()}`;
}

export function WishesElementView({ el, slug, mode = 'guest', locale = 'kz' }: Props) {
  const L = LABELS[locale];
  const accent = el.accentColor || '#6b1d3a';
  const ink = el.textColor || '#2c1810';

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // In the editor and in the catalogue preview there is no published slug to
  // read from, so a sample wish stands in — otherwise the host designs against
  // an empty box and cannot see what the section looks like in use.
  const sample = useMemo<Wish[]>(
    () => [
      {
        id: 'sample-1',
        authorName: locale === 'kz' ? 'Айжан және Арман' : 'Айжан и Арман',
        text:
          locale === 'kz'
            ? 'Бақытты болыңыздар! Шаңырақтарың берік, ырыздықтарың мол болсын!'
            : 'Совет да любовь! Пусть ваш дом всегда будет полон радости.',
        createdAt: new Date().toISOString(),
        reactions: { heart: 3, celebrate: 1 },
      },
    ],
    [locale],
  );

  useEffect(() => {
    if (mode !== 'guest' || !slug) {
      setWishes(sample);
      return;
    }
    let alive = true;
    fetch(`/api/wishes?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (Array.isArray(data.wishes)) setWishes(data.wishes);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug, mode, sample]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim() || loading) return;

    if (mode !== 'guest' || !slug) {
      setOpen(false);
      setDone(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, authorName: name.trim(), text: text.trim() }),
      });
      const saved = await res.json().catch(() => null);
      if (res.ok && saved?.wish?.id) {
        setWishes((prev) => [saved.wish as Wish, ...prev]);
        setName('');
        setText('');
        setOpen(false);
        setDone(true);
      }
    } catch {
      /* the wall is not worth an error dialog on an invitation */
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (wishId: string, key: WishReactionEmoji) => {
    // Optimistic: one reaction per guest per wish, so picking a new one moves
    // the count rather than adding to it — the same rule the API enforces.
    setWishes((prev) =>
      prev.map((w) => {
        if (w.id !== wishId) return w;
        const counts = { ...w.reactions };
        if (w.myReaction) counts[w.myReaction] = Math.max(0, (counts[w.myReaction] ?? 1) - 1);
        if (w.myReaction === key) return { ...w, reactions: counts, myReaction: null };
        counts[key] = (counts[key] ?? 0) + 1;
        return { ...w, reactions: counts, myReaction: key };
      }),
    );
    if (mode !== 'guest' || wishId.startsWith('sample-')) return;
    try {
      await fetch(`/api/wishes/${encodeURIComponent(wishId)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: key }),
      });
    } catch {
      /* ignore */
    }
  };

  const fontFamily = fontStack(el.fontFamily);
  const fieldStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: 14,
    border: `1px solid ${accent}2e`,
    backgroundColor: 'rgba(255,255,255,0.62)',
    color: ink,
    fontFamily,
    fontSize: 15,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ fontFamily, color: ink, width: '100%', boxSizing: 'border-box' }}>
      {el.title !== '' && (
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
          {el.title}
        </div>
      )}

      <div
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          textAlign: 'center',
          opacity: 0.72,
          marginBottom: 16,
        }}
      >
        {done ? L.thanks : L.subtitle}
      </div>

      {/*
        The wishes themselves come first — they are the reason to look.

        The list scrolls inside a fixed height rather than growing. On this
        canvas every element is absolutely positioned with an authored height,
        so a list that grows with the number of wishes pushes itself straight
        through the section below it: at two wishes the wall was already
        overlapping the closing photograph.
      */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 16,
          maxHeight: 300,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          // Without the fade the last card is sliced off mid-sentence by a
          // hard edge, which reads as a rendering fault rather than as "there
          // is more below".
          maskImage: 'linear-gradient(to bottom, #000 84%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 84%, transparent 100%)',
        }}
      >
        {wishes.length === 0 && (
          <div style={{ textAlign: 'center', fontSize: 14, opacity: 0.55, padding: '10px 0' }}>
            {L.empty}
          </div>
        )}
        {wishes.slice(0, 4).map((w) => (
          <div
            key={w.id}
            style={{
              padding: '14px 15px',
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.5)',
              border: `1px solid ${accent}1c`,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: accent,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12.5,
                  fontWeight: 600,
                  flexShrink: 0,
                  letterSpacing: '0.02em',
                }}
              >
                {initials(w.authorName)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{w.authorName}</div>
                <div style={{ fontSize: 12.5, opacity: 0.55 }}>{formatDate(w.createdAt, locale)}</div>
              </div>
            </div>

            <div style={{ fontSize: 15.5, lineHeight: 1.6, marginBottom: 10 }}>{w.text}</div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {WISH_REACTION_EMOJIS.map((key) => {
                const count = w.reactions?.[key] ?? 0;
                const mine = w.myReaction === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleReact(w.id, key)}
                    aria-pressed={mine}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 11px',
                      borderRadius: 999,
                      border: `1px solid ${mine ? accent : `${accent}26`}`,
                      backgroundColor: mine ? `${accent}1a` : 'rgba(255,255,255,0.6)',
                      fontSize: 13,
                      lineHeight: 1,
                      color: ink,
                      cursor: 'pointer',
                      fontFamily,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{WISH_REACTION_DISPLAY[key]}</span>
                    {count > 0 && <span style={{ opacity: 0.7 }}>{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {open ? (
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <input
            type="text"
            placeholder={L.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            style={fieldStyle}
          />
          <textarea
            placeholder={L.text}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={1000}
            style={{ ...fieldStyle, resize: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={loading || !name.trim() || !text.trim()}
              style={{
                flex: 1,
                backgroundColor: accent,
                color: '#fff',
                padding: '13px 0',
                borderRadius: 999,
                border: 'none',
                fontWeight: 600,
                fontSize: 15,
                fontFamily,
                cursor: 'pointer',
                opacity: loading || !name.trim() || !text.trim() ? 0.55 : 1,
              }}
            >
              {loading ? L.sending : L.send}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                padding: '13px 18px',
                borderRadius: 999,
                border: `1px solid ${accent}33`,
                backgroundColor: 'transparent',
                color: ink,
                fontSize: 15,
                fontFamily,
                cursor: 'pointer',
              }}
            >
              {L.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setDone(false);
          }}
          style={{
            display: 'block',
            margin: '0 auto',
            padding: '13px 30px',
            borderRadius: 999,
            border: `1px solid ${accent}`,
            backgroundColor: 'transparent',
            color: accent,
            fontSize: 15,
            fontWeight: 600,
            fontFamily,
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          {L.open}
        </button>
      )}
    </div>
  );
}
