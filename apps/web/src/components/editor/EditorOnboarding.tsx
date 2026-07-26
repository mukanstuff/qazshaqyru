'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/i18n';

interface EditorOnboardingProps {
  onDismiss: () => void;
}

export function EditorOnboarding({ onDismiss }: EditorOnboardingProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-fade-up sm:bottom-auto sm:left-auto sm:right-6 sm:top-28 sm:translate-x-0">
      <Card className="relative shadow-us-lg">
        <div
          className="absolute -top-2 left-1/2 hidden h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-us-border bg-us-surface sm:block"
          aria-hidden
        />
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-us-ink">{t('common.editorOnboarding')}</p>
          <Button type="button" variant="dark" size="sm" onClick={onDismiss} className="shrink-0">
            {t('common.editorOnboardingDismiss')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
