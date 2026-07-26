'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';

export type GuidedStepId = 'who' | 'when' | 'cover' | 'done';

interface GuidedValues {
  groomName: string;
  brideName: string;
  eventDate: string;
  eventTime: string;
  eventPlace: string;
  coverPhoto: string;
}

interface Props {
  open: boolean;
  templateName: string;
  initial: GuidedValues;
  onSkip: () => void;
  onComplete: (values: GuidedValues) => void;
  onCoverPick: (setUrl: (url: string) => void) => void;
}

const STEPS: GuidedStepId[] = ['who', 'when', 'cover', 'done'];

export function LiveEditorGuidedStart({
  open,
  templateName,
  initial,
  onSkip,
  onComplete,
  onCoverPick,
}: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<GuidedValues>(initial);
  const step = STEPS[stepIndex] ?? 'who';

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setValues(initial);
    // Only re-seed when dialog opens — avoid reset while typing if parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onSkip]);

  if (!open) return null;

  const canNext =
    step === 'who'
      ? Boolean(values.groomName.trim() || values.brideName.trim())
      : step === 'when'
        ? Boolean(values.eventDate)
        : true;

  const patch = (partial: Partial<GuidedValues>) =>
    setValues((prev) => ({ ...prev, ...partial }));

  return (
    <div className="live-editor-guided-root" data-testid="live-editor-guided">
      <div className="live-editor-guided" role="dialog" aria-modal="true" aria-labelledby="le-guided-title">
        <div className="live-editor-guided__head">
          <div>
            <p className="live-editor-guided__eyebrow">Давайте начнём · {templateName}</p>
            <h2 id="le-guided-title" className="live-editor-guided__title">
              {step === 'who' && 'Кто главные герои?'}
              {step === 'when' && 'Когда праздник?'}
              {step === 'cover' && 'Красивое фото'}
              {step === 'done' && 'Уже похоже на праздник'}
            </h2>
          </div>
          <button type="button" className="live-editor-sheet__close" onClick={onSkip} aria-label="Пропустить">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="live-editor-guided__dots" aria-hidden>
          {STEPS.map((id, i) => (
            <span
              key={id}
              className={
                i <= stepIndex
                  ? 'live-editor-guided__dot live-editor-guided__dot--on'
                  : 'live-editor-guided__dot'
              }
            />
          ))}
        </div>

        <div className="live-editor-guided__body">
          {step === 'who' ? (
            <>
              <label className="live-editor-field">
                <span className="live-editor-field__label">Жених / имя 1</span>
                <input
                  className="live-editor-field__input"
                  value={values.groomName}
                  onChange={(e) => patch({ groomName: e.target.value })}
                  data-testid="live-editor-guided-groom"
                  autoFocus
                />
              </label>
              <label className="live-editor-field">
                <span className="live-editor-field__label">Невеста / имя 2</span>
                <input
                  className="live-editor-field__input"
                  value={values.brideName}
                  onChange={(e) => patch({ brideName: e.target.value })}
                  data-testid="live-editor-guided-bride"
                />
              </label>
            </>
          ) : null}

          {step === 'when' ? (
            <>
              <label className="live-editor-field">
                <span className="live-editor-field__label">Дата</span>
                <input
                  className="live-editor-field__input"
                  type="date"
                  value={values.eventDate}
                  onChange={(e) => patch({ eventDate: e.target.value })}
                  data-testid="live-editor-guided-date"
                  autoFocus
                />
              </label>
              <label className="live-editor-field">
                <span className="live-editor-field__label">Время</span>
                <input
                  className="live-editor-field__input"
                  type="time"
                  value={values.eventTime}
                  onChange={(e) => patch({ eventTime: e.target.value })}
                />
              </label>
              <label className="live-editor-field">
                <span className="live-editor-field__label">Место</span>
                <input
                  className="live-editor-field__input"
                  value={values.eventPlace}
                  onChange={(e) => patch({ eventPlace: e.target.value })}
                  placeholder="Ресторан, город…"
                />
              </label>
            </>
          ) : null}

          {step === 'cover' ? (
            <div className="live-editor-field">
              <span className="live-editor-field__label">Обложка</span>
              <p className="live-editor-field__hint">
                {values.coverPhoto ? 'Фото выбрано — можно продолжить' : 'Можно пропустить и добавить позже'}
              </p>
              <button
                type="button"
                className="live-editor-photo-btn"
                onClick={() => onCoverPick((url) => patch({ coverPhoto: url }))}
                data-testid="live-editor-guided-cover"
              >
                {values.coverPhoto ? 'Заменить фото' : 'Загрузить фото'}
              </button>
            </div>
          ) : null}

          {step === 'done' ? (
            <div className="live-editor-guided__done">
              <Check className="h-8 w-8" aria-hidden />
              <p>Основа готова. Дальше просто нажимайте на блоки в приглашении — всё меняется на глазах.</p>
            </div>
          ) : null}
        </div>

        <div className="live-editor-guided__footer">
          <button type="button" className="live-editor-pill" onClick={onSkip}>
            Сразу к приглашению
          </button>
          {step === 'done' ? (
            <button
              type="button"
              className="live-editor-topbar__save"
              onClick={() => onComplete(values)}
              data-testid="live-editor-guided-finish"
            >
              Смотреть приглашение
            </button>
          ) : (
            <button
              type="button"
              className="live-editor-topbar__save"
              disabled={!canNext}
              onClick={() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))}
              data-testid="live-editor-guided-next"
            >
              Далее
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
