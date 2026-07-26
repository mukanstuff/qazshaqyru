'use client';

import { useState, useCallback } from 'react';
import { Link2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/shared/utils';

interface Props {
  invitationId?: string;
  disabled?: boolean;
  variant?: 'toolbar' | 'inline';
}

export function FamilyPreviewLink({ invitationId, disabled = false, variant = 'toolbar' }: Props) {
  const { toast } = useToast();
  const { t: tr } = useI18n();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyUrl = useCallback(async () => {
    if (!invitationId || disabled) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/family-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || tr('invitation.edit.familyPreviewFailed'));
      }
      const url = data.url as string;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast({
        title: tr('invitation.edit.familyPreviewCopied'),
        description: tr('invitation.edit.familyPreviewCopiedHint'),
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast({
        title: tr('invitation.edit.familyPreviewFailed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [invitationId, disabled, toast, tr]);

  if (!invitationId) return null;

  const isInline = variant === 'inline';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void copyUrl()}
      disabled={disabled || loading}
      className={cn(
        !isInline && 'text-white/90 hover:bg-white/10 hover:text-white'
      )}
      title={tr('invitation.edit.familyPreviewTitle')}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : copied ? (
        <Check size={14} />
      ) : (
        <Link2 size={14} />
      )}
      <span className="hidden sm:inline">
        {copied ? tr('invitation.edit.copied') : tr('invitation.edit.familyPreview')}
      </span>
    </Button>
  );
}
