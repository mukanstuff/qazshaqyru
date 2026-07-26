'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { QrCodePanel } from '@/components/shared/QrCodePanel';
import {
  buildKaspiTransferUrl,
  formatKaspiPhoneDisplay,
} from '@/lib/payments/kaspi-link';
import type { SectionProps } from './types';

export function KaspiGiftsSection({ ctx }: SectionProps) {
  const { t } = useI18n();
  const phone = typeof ctx.invitation.customText?.kaspiPhone === 'string'
    ? ctx.invitation.customText.kaspiPhone
    : '';
  const transferUrl = useMemo(() => (phone ? buildKaspiTransferUrl(phone) : null), [phone]);
  const displayPhone = phone ? formatKaspiPhoneDisplay(phone) : '';
  const slug = ctx.invitation.slug;
  const isDemo = slug === 'demo' || slug === 'draft';

  const [authorName, setAuthorName] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!phone || !transferUrl) return null;

  const markTransferred = async () => {
    if (isDemo) {
      setDone(true);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          authorName: authorName.trim() || 'Гость',
          note: note.trim() || undefined,
          guestToken: ctx.guestToken || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || t('public.kaspi.ackError'));
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('public.kaspi.ackError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="inv-section inv-manifest-kaspi" data-section="kaspi">
      <div className="inv-section__inner">
        <p className="inv-section-label">{t('public.kaspi.sectionLabel')}</p>
        <div className="inv-kaspi">
          <h2 className="inv-manifest-dress__title">{t('public.kaspi.title')}</h2>
          <p className="inv-program__desc">{t('public.kaspi.description')}</p>
          <p className="inv-program__time" style={{ marginTop: '0.75rem' }}>
            {displayPhone}
          </p>
          <div className="flex justify-center py-3">
            <QrCodePanel url={transferUrl} size={140} label={t('public.kaspi.qrLabel')} />
          </div>
          <a href={transferUrl} target="_blank" rel="noopener noreferrer">
            {t('public.kaspi.transferButton')}
          </a>
          {!done ? (
            <div className="mt-4 space-y-2 text-left">
              <p className="font-body text-xs opacity-70">{t('public.kaspi.ackHint')}</p>
              <input
                className="w-full rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-sm"
                placeholder={t('public.kaspi.namePlaceholder')}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={100}
              />
              <input
                className="w-full rounded-lg border border-black/10 bg-white/80 px-3 py-2 text-sm"
                placeholder={t('public.kaspi.notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
              />
              {error ? <p className="text-xs text-red-700">{error}</p> : null}
              <button
                type="button"
                className="inv-btn-rsvp--outline inv-btn-rsvp"
                disabled={submitting}
                onClick={() => void markTransferred()}
              >
                {submitting ? '…' : t('public.kaspi.ackButton')}
              </button>
            </div>
          ) : (
            <p className="mt-3 font-body text-sm text-us-success">{t('public.kaspi.ackDone')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
