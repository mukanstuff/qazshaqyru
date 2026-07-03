'use client';

import { useState, useCallback } from 'react';
import { Check, Link2, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useToast } from '@/components/ui/toaster';

interface FamilyPreviewButtonProps {
  invitationId?: string;
  variant?: 'toolbar' | 'wizard';
  disabled?: boolean;
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

export function FamilyPreviewButton({
  invitationId,
  variant = 'toolbar',
  disabled = false,
}: FamilyPreviewButtonProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!invitationId) {
      toast({
        title: t('familyPreview.saveFirst'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/family-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || t('familyPreview.error'));
      }
      await copyText(data.url as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({
        title: t('familyPreview.copiedTitle'),
        description: t('familyPreview.copiedHint'),
      });
    } catch (err) {
      toast({
        title: t('familyPreview.error'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [invitationId, toast, t]);

  const isWizard = variant === 'wizard';

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={disabled || loading}
      
      
      title={t('familyPreview.hint')}
    >
      {loading ? (
        <Loader2 size={14}   />
      ) : copied ? (
        <Check size={14}  />
      ) : (
        <Link2 size={14}  />
      )}
      <span >
        {copied ? t('familyPreview.copied') : t('familyPreview.button')}
      </span>
    </button>
  );
}
