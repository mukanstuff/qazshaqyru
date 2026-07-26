'use client';

import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { FamilyPreviewLink } from './FamilyPreviewLink';

interface FamilyPreviewCardProps {
  invitationId?: string;
  disabled?: boolean;
}

/** Draft editor banner: share preview link with family before payment. */
export function FamilyPreviewCard({ invitationId, disabled = false }: FamilyPreviewCardProps) {
  const { t } = useI18n();

  return (
    <Card className="shadow-us-sm" aria-label={t('familyPreview.cardTitle')}>
      <CardContent className="flex gap-3 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-us-accent/8 text-us-accent"
          aria-hidden
        >
          <Users size={18} />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="font-body text-sm font-medium text-us-ink">{t('familyPreview.cardTitle')}</p>
          <p className="font-body text-xs text-us-ink-muted">{t('familyPreview.cardHint')}</p>
          {!invitationId ? (
            <p className="font-body text-xs text-us-ink-muted">{t('familyPreview.saveFirst')}</p>
          ) : (
            <FamilyPreviewLink invitationId={invitationId} disabled={disabled} variant="inline" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
