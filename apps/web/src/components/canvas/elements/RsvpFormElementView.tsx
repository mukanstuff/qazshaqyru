'use client';

import { useState } from 'react';
import type { RsvpFormElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

interface Props {
  el: RsvpFormElement;
  shareUrl?: string;
  mode?: 'editor' | 'guest';
}

export function RsvpFormElementView({ el, shareUrl, mode = 'guest' }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'attending' | 'not_attending'>('attending');
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
    if (!slug || !name.trim() || !phone.trim()) {
      setError('Заполните имя и телефон');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rsvp/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          phone: phone.trim(),
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Ошибка отправки');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки RSVP');
    } finally {
      setLoading(false);
    }
  };

  const fontFamily = fontStack(el.fontFamily);
  const bgColor = el.bgColor || '#ffffff';
  const textColor = el.textColor || '#2c1810';
  const btnColor = el.accentColor || '#6b1d3a';
  const btnTextColor = '#ffffff';

  return (
    <div
      style={{
        fontFamily,
        backgroundColor: bgColor,
        color: textColor,
        padding: 16,
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid rgba(107,29,58,0.1)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, textAlign: 'center' }}>
        {el.title || 'Подтвердите присутствие'}
      </div>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16, textAlign: 'center' }}>
        Пожалуйста, ответьте до мероприятия
      </div>

      {submitted ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#2d6a4f', fontWeight: 600 }}>
          ✓ Рахмет! Ваш ответ сохранён.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #dcd3cb',
              fontSize: 14,
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="tel"
            placeholder="Номер телефона (+7...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #dcd3cb',
              fontSize: 14,
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setStatus('attending')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: status === 'attending' ? `2px solid ${btnColor}` : '1px solid #dcd3cb',
                backgroundColor: status === 'attending' ? 'rgba(107,29,58,0.08)' : 'transparent',
                fontWeight: status === 'attending' ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              Приду
            </button>
            <button
              type="button"
              onClick={() => setStatus('not_attending')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: status === 'not_attending' ? `2px solid ${btnColor}` : '1px solid #dcd3cb',
                backgroundColor: status === 'not_attending' ? 'rgba(107,29,58,0.08)' : 'transparent',
                fontWeight: status === 'not_attending' ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              Не смогу
            </button>
          </div>
          {error && <div style={{ color: '#b42318', fontSize: 12 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: btnColor,
              color: btnTextColor,
              padding: '10px 0',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      )}
    </div>
  );
}
