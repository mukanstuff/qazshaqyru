'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { CaptchaWidget } from '@/components/CaptchaWidget';
import { useI18n } from '@/i18n';
import { isCaptchaRequiredOnClient } from '@/lib/captcha-client';
import {
  WISH_REACTION_DISPLAY,
  WISH_REACTION_EMOJIS,
  type WishReactionEmoji,
  emptyReactionCounts,
} from '@/lib/wish-reactions';

export interface WishItem {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  reactions: Record<WishReactionEmoji, number>;
  myReaction: WishReactionEmoji | null;
}

interface WishesWallProps {
  slug: string;
  accent?: string;
}

export function WishesWall({ slug, accent = '#C4985A' }: WishesWallProps) {
  const { t } = useI18n();
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reactingId, setReactingId] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRequired = isCaptchaRequiredOnClient();

  const loadWishes = useCallback(async () => {
    try {
      const res = await fetch(`/api/wishes?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setWishes(data.wishes ?? []);
      }
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug === 'demo') {
      setLoading(false);
      return;
    }
    void loadWishes();
  }, [slug, loadWishes]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (slug === 'demo') return;
    if (captchaRequired && !captchaToken) {
      setError(t('public.captcha.required'));
      return;
    }
    const formData = new FormData(e.currentTarget);
    const website = (formData.get('website') as string) || undefined;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          authorName: authorName.trim(),
          text: text.trim(),
          website,
          captchaToken: captchaToken ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || t('errors.generic'));
        return;
      }
      if (data.wish) {
        setWishes((prev) => [data.wish as WishItem, ...prev]);
      }
      setAuthorName('');
      setText('');
      setCaptchaToken(null);
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (wishId: string, emoji: WishReactionEmoji) => {
    setReactingId(wishId);
    try {
      const res = await fetch(`/api/wishes/${wishId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishes((prev) =>
          prev.map((w) => {
            if (w.id !== wishId) return w;
            const reactions = data.reactions ?? w.reactions;
            const likeCount = Object.values(reactions as Record<WishReactionEmoji, number>).reduce(
              (sum, n) => sum + n,
              0,
            );
            return {
              ...w,
              reactions,
              myReaction: data.myReaction ?? emoji,
              likeCount,
              likedByMe: Boolean(data.myReaction ?? emoji),
            };
          }),
        );
      }
    } catch {
      /* non-critical */
    } finally {
      setReactingId(null);
    }
  };

  return (
    <section  >
      <div >
        <p
          
        >
          {t('public.wishes.sectionLabel')}
        </p>
        <h2
          
        >
          {t('public.wishes.title')}
        </h2>

        <form onSubmit={handleSubmit}  >
          {error && (
            <p >
              {error}
            </p>
          )}
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={t('public.wishes.namePlaceholder')}
            maxLength={100}
            required
            
            
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('public.wishes.textPlaceholder')}
            maxLength={1000}
            rows={3}
            required
            
            
          />
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="sr-only"
            aria-hidden="true"
          />
          <CaptchaWidget onTokenChange={setCaptchaToken} />
          <button
            type="submit"
            disabled={submitting}
            
            
          >
            {submitting ? <Loader2  /> : <Send size={16} />}
            {t('public.wishes.submit')}
          </button>
        </form>

        {loading ? (
          <p >
            {t('common.loading')}
          </p>
        ) : wishes.length === 0 ? (
          <p >
            {t('public.wishes.empty')}
          </p>
        ) : (
          <ul >
            {wishes.map((wish) => (
              <li
                key={wish.id}
                
              >
                <p >
                  {wish.authorName}
                </p>
                <p >
                  {wish.text}
                </p>
                <div
                  
                  role="group"
                  aria-label={t('public.wishes.reactionsLabel')}
                >
                  {reactingId === wish.id && (
                    <Loader2   />
                  )}
                  {WISH_REACTION_EMOJIS.map((emoji) => {
                    const count = wish.reactions?.[emoji] ?? 0;
                    const isMine = wish.myReaction === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        
                        onClick={() => void handleReact(wish.id, emoji)}
                        disabled={reactingId === wish.id}
                        title={t(`public.wishes.reactions.${emoji}`)}
                        
                      >
                        <span aria-hidden>{WISH_REACTION_DISPLAY[emoji]}</span>
                        {count > 0 && (
                          <span >{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
