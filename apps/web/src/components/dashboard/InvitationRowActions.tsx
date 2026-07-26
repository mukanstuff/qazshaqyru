'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ExternalLink, Copy, Check, Download } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useToast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { RemindGuestsButton } from './RemindGuestsButton';
import { RestaurantShareButton } from './RestaurantShareButton';

interface Props {
  invitationId: string;
  slug: string;
  status: string;
  restaurantLinkAllowed?: boolean;
}

export function InvitationRowActions({
  invitationId,
  slug,
  status,
  restaurantLinkAllowed = false,
}: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/i/${slug}` : `/i/${slug}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t('invitation.edit.copied') });
    } catch {
      toast({ title: t('errors.generic'), variant: 'destructive' });
    }
  }, [publicUrl, t, toast]);

  const exportGuests = useCallback(async () => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/guests/export`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guests-${slug}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t('dashboard.exportGuestsError'), variant: 'destructive' });
    }
  }, [invitationId, slug, t, toast]);

  if (status !== 'published') return null;

  return (
    <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.preventDefault()}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          void copyLink();
        }}
        title={t('dashboard.copyPublicLink')}
      >
        {copied ? <Check size={16} className="text-us-success" /> : <Copy size={16} />}
      </Button>
      <Button variant="ghost" size="icon-sm" asChild>
        <Link
          href={`/i/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={t('dashboard.openPublic')}
        >
          <ExternalLink size={16} />
        </Link>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          void exportGuests();
        }}
        title={t('dashboard.exportGuests')}
      >
        <Download size={16} />
      </Button>
      <RemindGuestsButton invitationId={invitationId} />
      <RestaurantShareButton
        invitationId={invitationId}
        status={status}
        restaurantLinkAllowed={restaurantLinkAllowed}
      />
    </div>
  );
}
