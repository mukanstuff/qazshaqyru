'use client';

import { useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import { useI18n } from '@/i18n';

/**
 * Asks the owner to rate the service — after their toi, never before.
 *
 * Timing is the whole design. Asked at publish time the customer has nothing to
 * judge yet: the invitation has not been opened by anyone, no guest has
 * answered, nothing has been proved. Asked the day after the event they know
 * exactly whether the thing worked, and that is also the moment the answer is
 * worth reading. So this renders only once the event date has passed.
 *
 * It exists because the landing has no social proof and the only honest way to
 * get some is to collect it. Nothing here seeds or suggests a rating; a one-star
 * review is submitted the same way as a five-star one.
 */

interface Props {
  invitationId: string;
  defaultAuthorName: string;
  /** True once the event date is in the past. */
  eventPassed: boolean;
  /** True when this invitation already has a review. */
  alreadyReviewed: boolean;
}

const COPY = {
  ru: {
    title: 'Как прошёл ваш той?',
    body: 'Одна честная оценка помогает следующей семье выбрать. Покажем на сайте после проверки.',
    name: 'Как вас подписать',
    text: 'Что получилось, а что нет',
    submit: 'Отправить отзыв',
    sending: 'Отправляем…',
    okTitle: 'Спасибо',
    okBody: 'Отзыв получен. Опубликуем после проверки.',
    failed: 'Не получилось отправить. Попробуйте ещё раз.',
    needRating: 'Поставьте оценку',
    needText: 'Напишите пару предложений',
  },
  kz: {
    title: 'Тойыңыз қалай өтті?',
    body: 'Бір шынайы баға келесі отбасына таңдауға көмектеседі. Тексергеннен кейін сайтта көрсетеміз.',
    name: 'Атыңызды қалай жазайық',
    text: 'Не ұнады, не ұнамады',
    submit: 'Пікір жіберу',
    sending: 'Жіберілуде…',
    okTitle: 'Рақмет',
    okBody: 'Пікіріңіз қабылданды. Тексергеннен кейін жарияланады.',
    failed: 'Жіберу мүмкін болмады. Қайталап көріңіз.',
    needRating: 'Баға қойыңыз',
    needText: 'Бірер сөйлем жазыңыз',
  },
} as const;

export function HubReviewPrompt({
  invitationId,
  defaultAuthorName,
  eventPassed,
  alreadyReviewed,
}: Props) {
  const { locale } = useI18n();
  const t = COPY[locale === 'kz' ? 'kz' : 'ru'];

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'err'>('idle');
  const [error, setError] = useState('');

  if (!eventPassed || alreadyReviewed) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'busy') return;
    if (rating === 0) {
      setStatus('err');
      setError(t.needRating);
      return;
    }
    if (text.trim().length < 10) {
      setStatus('err');
      setError(t.needText);
      return;
    }
    setStatus('busy');
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId,
          rating,
          text: text.trim(),
          authorName: authorName.trim() || defaultAuthorName,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('done');
    } catch {
      setStatus('err');
      setError(t.failed);
    }
  };

  if (status === 'done') {
    return (
      <div className="hub-review hub-review--done">
        <p className="hub-review__title">{t.okTitle}</p>
        <p className="hub-review__body">{t.okBody}</p>
      </div>
    );
  }

  return (
    <form className="hub-review" onSubmit={submit}>
      <p className="hub-review__title">{t.title}</p>
      <p className="hub-review__body">{t.body}</p>

      <div className="hub-review__stars" role="radiogroup" aria-label={t.needRating}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={String(n)}
            onClick={() => {
              setRating(n);
              if (status === 'err') setStatus('idle');
            }}
            className="hub-review__star"
          >
            <Star
              className={n <= rating ? 'hub-review__star-icon is-on' : 'hub-review__star-icon'}
            />
          </button>
        ))}
      </div>

      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder={t.name}
        aria-label={t.name}
        maxLength={80}
        className="hub-review__input"
      />
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (status === 'err') setStatus('idle');
        }}
        placeholder={t.text}
        aria-label={t.text}
        rows={3}
        maxLength={1000}
        className="hub-review__input hub-review__textarea"
      />

      {status === 'err' && error ? (
        <p className="hub-review__error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="hub-review__submit" disabled={status === 'busy'}>
        {status === 'busy' ? t.sending : t.submit}
      </button>
    </form>
  );
}
