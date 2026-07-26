'use client';

import { useState, useCallback } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useToast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { formatReminderLinksForClipboard } from '@/lib/guests/guest-reminders';

interface ReminderGuest {
  id: string;
  name: string;
  phone: string | null;
  inviteUrl: string;
  whatsappLink: string | null;
}

interface Props {
  invitationId: string;
}

export function RemindGuestsButton({ invitationId }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleRemind = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}/remind`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message ?? 'remind failed');
      }

      const guests = (data.guests ?? []) as ReminderGuest[];
      const withLinks = guests.filter((g) => g.whatsappLink);

      if (withLinks.length === 0) {
        toast({
          title: data.message ?? t('dashboard.remind.none'),
          variant: withLinks.length === 0 && guests.length === 0 ? 'default' : 'destructive',
        });
        return;
      }

      if (withLinks.length === 1 && withLinks[0].whatsappLink) {
        window.open(withLinks[0].whatsappLink, '_blank', 'noopener,noreferrer');
        toast({ title: t('dashboard.remind.opened') });
        return;
      }

      const text = formatReminderLinksForClipboard(withLinks);
      await navigator.clipboard.writeText(text);
      toast({
        title: t('dashboard.remind.copiedTitle'),
        description: t('dashboard.remind.copiedDesc'),
      });
    } catch {
      toast({ title: t('dashboard.remind.error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [invitationId, t, toast]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        void handleRemind();
      }}
      disabled={loading}
      title={t('dashboard.remind.button')}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell size={16} />}
    </Button>
  );
}
