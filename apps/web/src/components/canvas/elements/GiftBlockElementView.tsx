'use client';

import { useEffect, useState } from 'react';
import type { GiftBlockElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';
import { buildKaspiTransferUrl, formatKaspiPhoneDisplay } from '@/lib/payments/kaspi-link';

interface GiftTransfer {
  id: string;
  authorName: string | null;
  note: string | null;
  guestName: string | null;
  createdAt: string;
}

interface Props {
  el: GiftBlockElement;
  shareUrl?: string;
  mode?: 'editor' | 'guest';
}

export function GiftBlockElementView({ el, mode = 'guest' }: Props) {
  const [transfers, setTransfers] = useState<GiftTransfer[]>([]);
  const [copied, setCopied] = useState(false);

  const kaspiPhoneOrCard = el.kaspiPhone || el.kaspiCard || '';
  const kaspiUrl = el.kaspiPhone ? buildKaspiTransferUrl(el.kaspiPhone) : el.kaspiCard ? buildKaspiTransferUrl(el.kaspiCard) : null;
  const displayPhone = el.kaspiPhone ? formatKaspiPhoneDisplay(el.kaspiPhone) : el.kaspiCard ? formatKaspiPhoneDisplay(el.kaspiCard) : '';

  const invitationId = el.templateBindTo || '';

  useEffect(() => {
    if (mode !== 'guest' || !el.showDonors || !invitationId) return;
    let alive = true;
    fetch(`/api/gifts?invitationId=${encodeURIComponent(invitationId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (alive && Array.isArray(data.transfers)) {
          setTransfers(data.transfers);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [invitationId, el.showDonors, mode]);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(kaspiPhoneOrCard);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const fontFamily = 'Montserrat, system-ui, sans-serif';
  const bgColor = '#ffffff';
  const textColor = '#2c1810';

  return (
    <div
      style={{
        fontFamily,
        backgroundColor: bgColor,
        color: textColor,
        padding: 18,
        borderRadius: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid rgba(107,29,58,0.1)',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
        {el.title || 'Поздравление онлайн'}
      </div>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 14 }}>
        {el.subtitle || 'Вы можете отправить подарок через Kaspi'}
      </div>

      {kaspiPhoneOrCard && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 8,
            backgroundColor: '#f8f4f0',
            border: '1px solid rgba(0,0,0,0.08)',
            marginBottom: 14,
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span>{displayPhone || kaspiPhoneOrCard}</span>
          <button
            type="button"
            onClick={copyNumber}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b1d3a',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {copied ? '✓' : 'Копировать'}
          </button>
        </div>
      )}

      <div>
        {kaspiUrl ? (
          <a
            href={kaspiUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: 8,
              backgroundColor: el.accentColor || '#e12c2c',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(225,44,44,0.3)',
            }}
          >
            Открыть в Kaspi →
          </a>
        ) : (
          <span style={{ fontSize: 12, color: '#6b5a52' }}>Реквизиты Kaspi не указаны</span>
        )}
      </div>

      {el.showDonors && transfers.length > 0 && (
        <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', opacity: 0.7 }}>
            Недавние подарки
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {transfers.slice(0, 3).map((t) => (
              <div key={t.id} style={{ fontSize: 12, padding: 6, backgroundColor: '#fcfaf8', borderRadius: 6 }}>
                <span style={{ fontWeight: 600 }}>{t.authorName || 'Гость'}: </span>
                <span>{t.note || 'Поздравляем!'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
