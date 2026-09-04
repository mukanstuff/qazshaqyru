'use client';

import { useCallback, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatKzt } from '@/lib/shared/format-price';

interface Props {
  /** Required for target 'template'. */
  invitationId?: string;
  target?: 'template' | 'agency';
  /** Fires with the accepted code, or null when it is cleared. */
  onApplied: (code: string | null) => void;
}

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'applied'; code: string; discountKzt: number; finalKzt: number }
  | { kind: 'rejected'; message: string };

/**
 * "I have a promo code" — collapsed by default.
 *
 * Collapsed on purpose: an always-open, always-empty discount box on a payment
 * screen invites everyone to leave and go hunting for a code before they pay,
 * and most of them do not come back. It opens for the people who already have
 * one.
 *
 * Validation is a preview only — the code is not spent here. The server takes
 * the redemption when the order is created, and the checkout response is what
 * actually says whether it applied.
 */
export function PromoCodeField({ invitationId, target = 'template', onApplied }: Props) {
  const { locale } = useI18n();
  const L =
    locale === 'ru'
      ? {
          toggle: 'У меня есть промокод',
          placeholder: 'Промокод',
          apply: 'Применить',
          applied: 'Скидка',
          remove: 'Убрать промокод',
          total: 'К оплате',
          error: 'Не удалось проверить промокод',
        }
      : {
          toggle: 'Менде промокод бар',
          placeholder: 'Промокод',
          apply: 'Қолдану',
          applied: 'Жеңілдік',
          remove: 'Промокодты алып тастау',
          total: 'Төлеуге',
          error: 'Промокодты тексеру мүмкін болмады',
        };

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });

  const check = useCallback(async () => {
    const code = value.trim();
    if (!code) return;
    setState({ kind: 'checking' });
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, target, invitationId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        valid?: boolean;
        message?: string;
        code?: string;
        discountKzt?: number;
        finalKzt?: number;
      };
      if (!res.ok) throw new Error(data.message || L.error);
      if (!data.valid) {
        setState({ kind: 'rejected', message: data.message || L.error });
        onApplied(null);
        return;
      }
      setState({
        kind: 'applied',
        code: data.code!,
        discountKzt: data.discountKzt ?? 0,
        finalKzt: data.finalKzt ?? 0,
      });
      onApplied(data.code!);
    } catch (e) {
      setState({ kind: 'rejected', message: e instanceof Error ? e.message : L.error });
      onApplied(null);
    }
  }, [L.error, invitationId, onApplied, target, value]);

  const clear = useCallback(() => {
    setValue('');
    setState({ kind: 'idle' });
    onApplied(null);
  }, [onApplied]);

  if (!open) {
    return (
      <button type="button" className="promo-toggle" onClick={() => setOpen(true)}>
        {L.toggle}
      </button>
    );
  }

  if (state.kind === 'applied') {
    return (
      <div className="promo-applied">
        <Check size={15} aria-hidden="true" />
        <span className="promo-applied__code">{state.code}</span>
        <span className="promo-applied__amount">
          −{formatKzt(state.discountKzt)} · {L.total} {formatKzt(state.finalKzt)}
        </span>
        <button type="button" onClick={clear} aria-label={L.remove} className="promo-applied__clear">
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="promo-field">
      <div className="promo-field__row">
        <input
          className="promo-field__input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (state.kind === 'rejected') setState({ kind: 'idle' });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void check();
            }
          }}
          placeholder={L.placeholder}
          aria-label={L.placeholder}
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
        />
        <button
          type="button"
          className="promo-field__apply"
          onClick={() => void check()}
          disabled={state.kind === 'checking' || value.trim().length === 0}
        >
          {state.kind === 'checking' ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            L.apply
          )}
        </button>
      </div>
      {state.kind === 'rejected' ? <p className="promo-field__error">{state.message}</p> : null}
    </div>
  );
}
