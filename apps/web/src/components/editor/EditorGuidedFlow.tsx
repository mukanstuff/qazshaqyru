'use client';

import { Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/shared/utils';
import {
  getEditorGuidedFlowSteps,
  getGuidedFlowAction,
  getNextGuidedFlowStep,
  type EditorGuidedFlowStep,
} from '@/lib/shared/ux-guided-flow';
import { dispatchEditorGuidedAction } from './editor-events';

interface EditorGuidedFlowProps {
  title: string;
  eventDate: string;
  eventPlace?: string | null;
  guestsCount: number;
  isPublished: boolean;
}

const STEP_LABEL_KEYS: Record<EditorGuidedFlowStep['key'], string> = {
  event: 'guidedFlow.stepEvent',
  guests: 'guidedFlow.stepGuests',
  publish: 'guidedFlow.stepPublish',
};

const STEP_HINT_KEYS: Record<EditorGuidedFlowStep['key'], string> = {
  event: 'guidedFlow.stepEventHint',
  guests: 'guidedFlow.stepGuestsHint',
  publish: 'guidedFlow.stepPublishHint',
};

export function EditorGuidedFlow({
  title,
  eventDate,
  eventPlace,
  guestsCount,
  isPublished,
}: EditorGuidedFlowProps) {
  const { t } = useI18n();
  const steps = getEditorGuidedFlowSteps({ title, eventDate, eventPlace, guestsCount, isPublished });
  const completed = steps.filter((step) => step.done).length;
  const nextStep = getNextGuidedFlowStep(steps);
  const progressPct = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

  const handleStepClick = (step: EditorGuidedFlowStep) => {
    const action = getGuidedFlowAction(step.key);
    if (action) dispatchEditorGuidedAction(action);
  };

  const handleNext = () => {
    if (!nextStep) return;
    const action = getGuidedFlowAction(nextStep.key);
    if (action) dispatchEditorGuidedAction(action);
  };

  return (
    <Card className="shadow-us-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-display text-lg">{t('guidedFlow.ariaLabel')}</CardTitle>
          {nextStep ? (
            <Button type="button" variant="secondary" size="sm" onClick={handleNext}>
              {t('guidedFlow.nextStep')}
              <ChevronRight size={14} aria-hidden />
            </Button>
          ) : null}
        </div>
        <p className="font-body text-xs text-us-ink-muted">
          {t('guidedFlow.progress', { current: completed, total: steps.length })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-us-accent/10" aria-hidden>
          <div
            className="h-full rounded-full bg-us-accent transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="space-y-2">
          {steps.map((step) => (
            <button
              key={step.key}
              type="button"
              className={cn(
                'flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
                step.done
                  ? 'border-us-accent/20 bg-us-accent/5'
                  : 'border-us-border bg-us-surface hover:border-us-accent/25 hover:bg-us-accent/[0.03]'
              )}
              onClick={() => handleStepClick(step)}
              aria-pressed={step.done}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                  step.done
                    ? 'border-us-accent bg-us-accent text-white'
                    : 'border-us-border text-us-ink-muted'
                )}
                aria-hidden
              >
                {step.done ? <Check size={12} strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block font-body text-sm font-medium text-us-ink">
                  {t(STEP_LABEL_KEYS[step.key])}
                </span>
                <span className="block font-body text-xs text-us-ink-muted">
                  {t(STEP_HINT_KEYS[step.key])}
                </span>
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
