'use client';

import { useCallback, useState } from 'react';
import { Building2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

interface Props {
  invitationId: string;
  status: string;
  /** When false, show upgrade hint instead of create. */
  restaurantLinkAllowed: boolean;
}

/**
 * Dashboard-first restaurant share — copy/create portal link without GuestOpsHub.
 */
export function RestaurantShareButton({
  invitationId,
  status,
  restaurantLinkAllowed,
}: Props) {
  const { toast } = useToast();
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
      if (!res.ok || !data.url) throw new Error(data.message || 'Не удалось создать ссылку');
      setUrl(data.url);
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Ссылка для тойханы скопирована' });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : 'Ошибка',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }, [invitationId, restaurantLinkAllowed, status, toast]);

  if (status !== 'published') return null;

  if (!restaurantLinkAllowed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled
        title="Standard: портал для менеджера тойханы"
        onClick={(e) => e.stopPropagation()}
      >
        <Building2 size={16} className="text-us-ink-muted" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={busy}
      title={url ? 'Скопировать ссылку тойханы' : 'Ссылка для менеджера тойханы'}
      onClick={(e) => {
        e.stopPropagation();
        void createAndCopy();
      }}
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
    </Button>
  );
}
