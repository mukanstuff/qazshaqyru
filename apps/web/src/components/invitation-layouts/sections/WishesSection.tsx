'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { CaptchaWidget } from '@/components/shared/CaptchaWidget';
import type { SectionProps } from './types';

interface WishItem {
  id: string;
  authorName: string;
  text: string;
  likeCount: number;
  myReaction: string | null;
  reactions: Record<string, number>;
}

const REACTION_EMOJI = ['❤️', '🙏', '🎉', '👏'] as const;

export function WishesSection({ ctx }: SectionProps) {
  const { t } = useI18n();
  const isKz = ctx.invitation.language === 'kz';
  const slug = ctx.invitation.slug;

  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const loadWishes = useCallback(async () => {
    if (slug === 'demo' || slug === 'draft') {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/wishes?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { wishes: WishItem[] };
      setWishes(data.wishes ?? []);
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadWishes();
  }, [loadWishes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          authorName: authorName.trim(),
          text: text.trim(),
          captchaToken,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? t('errors.generic'));
      }
      setAuthorName('');
      setText('');
      setCaptchaToken(null);
      await loadWishes();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (wishId: string, emoji: string) => {
    try {
      await fetch(`/api/wishes/${wishId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, emoji }),
      });
      await loadWishes();
    } catch {
      /* non-critical */
    }
  };

  const visible = showAll ? wishes : wishes.slice(0, 3);

  return (
    <section className="inv-section inv-manifest-wishes" data-section="wishes">
      <div className="inv-section__inner">
        <p className="inv-label">{t('public.wishes.sectionLabel')}</p>
        <h2>{isKz ? 'Ізгі тілектер:' : t('public.wishes.title')}</h2>

        {slug !== 'demo' ? (
          <form className="inv-wishes-form" onSubmit={(e) => void handleSubmit(e)}>
            <input
              type="text"
              placeholder={t('public.wishes.namePlaceholder')}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={100}
              required
            />
            <textarea
              placeholder={t('public.wishes.textPlaceholder')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              rows={3}
              required
            />
            <CaptchaWidget onTokenChange={setCaptchaToken} />
            {error ? <p className="inv-wishes-form__error">{error}</p> : null}
            <button type="submit" className="inv-btn-rsvp" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
              {isKz ? 'ТІЛЕК ЖАЗУ' : t('public.wishes.submit')}
            </button>
          </form>
        ) : null}

        {loading ? (
          <p className="inv-wishes-empty">…</p>
        ) : visible.length === 0 ? (
          <p className="inv-wishes-empty">{t('public.wishes.empty')}</p>
        ) : (
          <ul className="inv-wishes-list">
            {visible.map((w) => (
              <li key={w.id} className="inv-wishes-card">
                <p className="inv-wishes-card__author">{w.authorName}</p>
                <p className="inv-wishes-card__text">{w.text}</p>
                <div className="inv-wishes-card__reactions">
                  {REACTION_EMOJI.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={
                        w.myReaction === emoji
                          ? 'inv-wishes-react inv-wishes-react--active'
                          : 'inv-wishes-react'
                      }
                      onClick={() => void handleReact(w.id, emoji)}
                      aria-label={emoji}
                    >
                      {emoji}
                      {(w.reactions[emoji] ?? 0) > 0 ? (
                        <span>{w.reactions[emoji]}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}

        {wishes.length > 3 && !showAll ? (
          <button
            type="button"
            className="inv-wishes-more"
            onClick={() => setShowAll(true)}
          >
            {isKz ? 'БАРЛЫҚ ТІЛЕКТЕРДІ ОҚУ' : 'Показать все'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
