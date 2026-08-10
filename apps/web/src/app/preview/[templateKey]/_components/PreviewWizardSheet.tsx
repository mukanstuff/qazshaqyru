'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardBody } from '@/components/quick-wizard/WizardBody';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/templates/html-engine/types';

interface PreviewWizardSheetProps {
  templateKey: string;
  templateId: string;
  templateName: string;
  locale: Locale;
  onClose?: () => void;
}

export function PreviewWizardSheet({
  templateKey,
  templateId,
  templateName,
  locale,
  onClose,
}: PreviewWizardSheetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleAfterPersist = (invitationId: string) => {
    // Redirect to canvas editor
    router.push(`/invitations/${invitationId}/canvas`);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-us-ink/55 backdrop-blur-md">
      {/* Header */}
      <div className="us-glass-strong flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="font-display text-lg font-medium text-us-ink">{templateName}</p>
          <p className="font-body text-sm text-us-ink-muted">Заполните данные приглашения</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClose}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Wizard body — full height minus header */}
      <div className="flex-1 overflow-y-auto">
        <WizardBody
          templateKey={templateKey}
          templateId={templateId}
          templateName={templateName}
          onAfterPersist={handleAfterPersist}
          continueLabel="Создать приглашение"
          header={undefined}
          footer={undefined}
        />
      </div>
    </div>
  );
}
