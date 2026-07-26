'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toaster';
import { useI18n } from '@/i18n';
import { checkoutInvitationClient } from '@/lib/payments/checkout-client';

export function useInvitationPublish(invitationId: string) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = useCallback(async (): Promise<boolean> => {
    setIsPublishing(true);
    try {
      const checkout = await checkoutInvitationClient(invitationId);
      if (checkout.published) {
        router.replace(`/invitations/${invitationId}?published=1`);
        return true;
      }
      if (checkout.paymentUrl) {
        window.location.href = checkout.paymentUrl;
        return true;
      }
      if (checkout.needsPayment) {
        router.replace(`/invitations/${invitationId}?payment=pending`);
        return true;
      }
      throw new Error(t('invitation.editorToasts.publishFailed'));
    } catch (err) {
      toast({
        title: t('invitation.editorToasts.publishFailed'),
        description: err instanceof Error ? err.message : t('errors.tryAgain'),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [invitationId, router, toast, t]);

  return { handlePublish, isPublishing, setIsPublishing };
}
