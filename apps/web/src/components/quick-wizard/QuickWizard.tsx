'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditorWorkspaceShell } from '@/components/editor/EditorWorkspaceShell';
import { useI18n } from '@/i18n';
import { WizardBody } from './WizardBody';

interface Props {
  templateKey: string;
  templateId: string;
  templateName: string;
}

/**
 * Standalone /create screen — preserved for backwards compatibility.
 * The new live preview flow lives at /preview/[templateKey] and uses
 * WizardBody within a bottom-sheet. /create?template=... still redirects
 * to /preview/<slug> so existing links (and OAuth returnTo) keep working.
 */
export function QuickWizard({ templateKey, templateId, templateName }: Props) {
  const { t } = useI18n();

  return (
    <EditorWorkspaceShell className="flex min-h-screen flex-col" data-testid="quick-wizard">
      <header className="sticky top-0 z-50 bg-us-accent text-white shadow-us-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-white/90 hover:bg-white/10 hover:text-white"
            onClick={() => {
              window.location.href = '/templates';
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>
      </header>

      <WizardBody
        templateKey={templateKey}
        templateId={templateId}
        templateName={templateName}
      />
    </EditorWorkspaceShell>
  );
}
