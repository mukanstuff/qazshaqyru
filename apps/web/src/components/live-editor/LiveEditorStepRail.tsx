'use client';

import { Check } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';
import type { EditorReadinessStep, EditorStepId } from '@/lib/invitations/editor-readiness';

interface Props {
  steps: EditorReadinessStep[];
  activeStepId: EditorStepId | null;
  onSelectStep: (stepId: EditorStepId) => void;
  completedSteps: number;
  totalSteps: number;
  nextHint?: string | null;
}

export function LiveEditorStepRail({
  steps,
  activeStepId,
  onSelectStep,
  completedSteps,
  totalSteps,
  nextHint,
}: Props) {
  const { t } = useI18n();

  return (
    <aside className="live-editor-steps" data-testid="live-editor-steps" aria-label={t('liveEditor.stepsNav')}>
      <div className="live-editor-steps__progress">
        <div className="live-editor-steps__progress-label">{t('liveEditor.steps.title')}</div>
        <div
          className="live-editor-steps__bar"
          role="progressbar"
          aria-valuenow={completedSteps}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
        >
          <span
            className="live-editor-steps__bar-fill"
            style={{ width: `${Math.round((completedSteps / Math.max(totalSteps, 1)) * 100)}%` }}
          />
        </div>
        {nextHint ? (
          <p className="live-editor-steps__hint">{t('liveEditor.steps.next')}: {nextHint}</p>
        ) : null}
      </div>

      <ol className="live-editor-steps__list">
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              className={cn(
                'live-editor-steps__item',
                step.completed && 'live-editor-steps__item--done',
                activeStepId === step.id && 'live-editor-steps__item--active',
              )}
              onClick={() => onSelectStep(step.id)}
              data-testid={`live-editor-step-${step.id}`}
            >
              <span className="live-editor-steps__index">
                {step.completed ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
              </span>
              <span className="live-editor-steps__meta">
                <span className="live-editor-steps__label">
                  {step.label}
                  {step.required ? <span className="live-editor-steps__req">*</span> : null}
                </span>
                <span className="live-editor-steps__sub">
                  {step.completed ? t('liveEditor.sectionReady') : t('liveEditor.sectionOpen')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
