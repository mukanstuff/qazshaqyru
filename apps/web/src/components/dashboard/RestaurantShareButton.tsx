'use client';

import { useCallback, useState } from 'react';
import { Building2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';

interface Props {
  invitationId: string;
  status: string;
  /** When false, show upgrade hint instead of create. */
  restaurantLinkAllowed: boolean;
}

/**
 * Dashboard-first restaurant share — copy/create portal link without opening the hub.
 */
export function RestaurantShareButton({
  invitationId,
  status,
  restaurantLinkAllowed,
}: Props) {
  const { toast } = useToast();
  // Every user-facing string here was a hardcoded Russian literal, so the
  // Kazakh interface rendered this button in Russian.
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const createAndCopy = useCallback(async () => {
    if (!restaurantLinkAllowed || status !== 'published') return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/restaurant-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!res.ok || !data.url) throw new Error(data.message || t('errors.generic'));
      setUrl(data.url);
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t('dashboard.restaurantLinkCopied') });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }, [invitationId, restaurantLinkAllowed, status, t, toast]);

  if (status !== 'published') return null;

  const label = t('dashboard.restaurantLink');
  const lockedLabel = t('dashboard.restaurantLinkLocked');

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11"
      disabled={busy || !restaurantLinkAllowed}
      title={restaurantLinkAllowed ? undefined : lockedLabel}
      aria-label={restaurantLinkAllowed ? label : lockedLabel}
      onClick={() => void createAndCopy()}
      data-testid={`restaurant-share-${invitationId}`}
    >
      {busy ? (
        <Loader2 size={16} className="animate-spin" />
      ) : copied ? (
        <Check size={16} className="text-us-success" />
      ) : url ? (
        <Copy size={16} />
      ) : (
        <Building2 size={16} />
      )}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
