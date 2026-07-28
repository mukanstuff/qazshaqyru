'use client';

import { useEffect, useState } from 'react';
import type { WishesElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

interface Wish {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
  reactions: Record<string, number>;
}

interface Props {
  el: WishesElement;
  shareUrl?: string;
  mode?: 'editor' | 'guest';
}

const EMOJIS = ['❤️', '👍', '🎉', '🔥', '🥰'];

export function WishesElementView({ el, shareUrl, mode = 'guest' }: Props) {
  const [wishes, setWishes] = useState<Wish[]>([
    {
      id: 'demo-1',
      authorName: 'Айжан & Арман',
      text: 'Бақытты болыңыздар! Үлкен махаббат тілейміз!',
      createdAt: new Date().toISOString(),
      reactions: { '❤️': 3, '🎉': 1 },
    },
  ]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const invitationId = el.templateBindTo || '';

  useEffect(() => {
    if (mode !== 'guest' || !invitationId) return;
    let alive = true;
    fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (alive && Array.isArray(data.wishes)) {
          setWishes(data.wishes);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [invitationId, mode]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    const newWish: Wish = {
      id: `local-${Date.now()}`,
      authorName: name.trim(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
      reactions: {},
    };
    setWishes((prev) => [newWish, ...prev]);
    setName('');
    setText('');
    if (mode === 'guest' && invitationId) {
      setLoading(true);
      try {
        await fetch('/api/wishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitationId,
            authorName: newWish.authorName,
            text: newWish.text,
          }),
        });
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReact = async (wishId: string, emoji: string) => {
    setWishes((prev) =>
      prev.map((w) => {
        if (w.id !== wishId) return w;
        const count = (w.reactions[emoji] || 0) + 1;
        return { ...w, reactions: { ...w.reactions, [emoji]: count } };
      })
    );
    if (mode === 'guest' && !wishId.startsWith('local-')) {
      try {
        await fetch(`/api/wishes/${encodeURIComponent(wishId)}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });
      } catch {
        /* ignore */
      }
    }
  };

  const fontFamily = fontStack(el.fontFamily);

  return (
    <div
      style={{
        fontFamily,
        backgroundColor: el.bgColor || '#ffffff',
        color: el.textColor || '#2c1810',
        padding: 16,
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid rgba(107,29,58,0.1)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
        {el.title || 'Пожелания гостям'}
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #dcd3cb',
            fontSize: 13,
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        <textarea
          placeholder="Напишите тёплое пожелание..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #dcd3cb',
            fontSize: 13,
            width: '100%',
            boxSizing: 'border-box',
            resize: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#6b1d3a',
            color: '#fff',
            padding: '8px 0',
            borderRadius: 6,
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {loading ? 'Отправка...' : 'Отправить пожелание'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
        {wishes.slice(0, 5).map((w) => (
          <div
            key={w.id}
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: 'rgba(107,29,58,0.04)',
              border: '1px solid rgba(107,29,58,0.08)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{w.authorName}</div>
            <div style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.4 }}>{w.text}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {EMOJIS.map((emoji) => {
                const cnt = w.reactions[emoji] || 0;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReact(w.id, emoji)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: 12,
                      border: '1px solid #dcd3cb',
                      backgroundColor: cnt > 0 ? '#f5ebe6' : '#ffffff',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {emoji} {cnt > 0 ? cnt : ''}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
