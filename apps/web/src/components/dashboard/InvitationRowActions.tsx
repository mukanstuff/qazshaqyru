'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ExternalLink, Copy, Check, Download, FileText, Map, Pencil } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useToast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { RemindGuestsButton } from './RemindGuestsButton';
import { RestaurantShareButton } from './RestaurantShareButton';

interface Props {
  invitationId: string;
  slug: string;
  status: string;
  editHref: string;
  restaurantLinkAllowed?: boolean;
  /** Mirrors the API gate on /guests/export: fullAccess || entitlements.csvExport. */
  csvAllowed?: boolean;
}

/**
 * Secondary actions for one dashboard row.
 *
 * Previously the whole card was wrapped in a <Link> to the hub and this strip
 * sat inside it, which meant (a) `<a>` elements nested inside an `<a>` —
 * invalid HTML that browsers silently un-nest, so the inner links behaved
 * unpredictably — and (b) a container-level `onClick={e => e.preventDefault()}`
 * plus a `stopPropagation` on every single button just to stop the card's own
 * navigation from firing. The card no longer wraps anything in a link, so all
 * of that defensive plumbing is gone.
 *
 * Labels are visible from `sm` up. They used to be `title` attributes only,
 * which do not exist on touch devices: on a phone this was six unlabelled
 * grey glyphs.
 */
export function InvitationRowActions({
  invitationId,
  slug,
  status,
  editHref,
  restaurantLinkAllowed = false,
  csvAllowed = false,
}: Props) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    const publicUrl = `${window.location.origin}/i/${slug}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t('invitation.edit.copied') });
    } catch {
      toast({ title: t('errors.generic'), variant: 'destructive' });
    }
  }, [slug, t, toast]);

  const exportGuests = useCallback(
    async (format: 'csv' | 'xlsx') => {
      try {
        const res = await fetch(`/api/invitations/${invitationId}/guests/export`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format, locale }),
        });
        if (!res.ok) throw new Error('export failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guests-${slug}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast({ title: t('dashboard.exportGuestsError'), variant: 'destructive' });
      }
    },
    [invitationId, locale, slug, t, toast]
  );

  if (status !== 'published') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="min-h-11" asChild>
          <Link href={editHref}>
            <Pencil size={16} />
            {t('dashboard.continueEditing')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" className="min-h-11" asChild>
        <Link href={`/i/${slug}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} />
          <span className="hidden sm:inline">{t('dashboard.openPublic')}</span>
        </Link>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11"
        onClick={() => void copyLink()}
        aria-label={t('dashboard.copyPublicLink')}
      >
        {copied ? <Check size={16} className="text-us-success" /> : <Copy size={16} />}
        <span className="hidden sm:inline">{t('dashboard.copyPublicLink')}</span>
      </Button>

      <RemindGuestsButton invitationId={invitationId} />

      <Button variant="outline" size="sm" className="min-h-11" asChild>
        <Link href={`/seating/${slug}`} target="_blank" rel="noopener noreferrer">
          <Map size={16} />
          <span className="hidden sm:inline">{t('dashboard.seatingPublic')}</span>
        </Link>
      </Button>

      {/*
        The export endpoint answers 402 unless the template was paid for, so an
        always-visible button was a button that silently did nothing for every
        free invitation (silently, because the toast provider was mis-mounted
        and no error ever rendered). Show the real reason instead.
      */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11"
        disabled={!csvAllowed}
        onClick={() => void exportGuests('xlsx')}
        aria-label={csvAllowed ? t('dashboard.exportXlsx') : t('dashboard.exportLocked')}
        title={csvAllowed ? undefined : t('dashboard.exportLocked')}
      >
        <Download size={16} />
        <span className="hidden sm:inline">{t('dashboard.exportXlsx')}</span>
      </Button>

      {/*
        CSV kept alongside: xlsx is what the тойхана opens, CSV is what other
        software imports. Icon-only, because it is the rarer of the two.
      */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11"
        disabled={!csvAllowed}
        onClick={() => void exportGuests('csv')}
        aria-label={csvAllowed ? t('dashboard.exportGuests') : t('dashboard.exportLocked')}
        title={csvAllowed ? t('dashboard.exportGuests') : t('dashboard.exportLocked')}
      >
        <FileText size={16} />
        <span className="sr-only">{t('dashboard.exportGuests')}</span>
      </Button>

      <RestaurantShareButton
        invitationId={invitationId}
        status={status}
        restaurantLinkAllowed={restaurantLinkAllowed}
      />
    </div>
  );
}
