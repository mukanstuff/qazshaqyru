'use client';

import { SuretRenderer } from '@/components/suret/SuretRenderer';
import { PublicPublishWatermark } from '@/components/invitation-layouts/PublicPublishWatermark';
import type { SuretTemplateManifest } from '@/lib/templates/manifest-types';

interface Props {
  manifest: SuretTemplateManifest;
  slots: Record<string, string>;
  locale: 'ru' | 'kz';
  showWatermark: boolean;
  slug: string;
}

/**
 * Guest-facing Suret: image + download. No RSVP chrome (Stories share path).
 */
export function SuretPublicView({
  manifest,
  slots,
  locale,
  showWatermark,
  slug,
}: Props) {
  return (
    <div className="min-h-screen bg-us-ivory px-4 py-8" data-testid="suret-public-view">
      <div className="mx-auto max-w-md space-y-4">
        <SuretRenderer
          manifest={manifest}
          locale={locale}
          editable={false}
          initialSlots={slots}
        />
        {showWatermark ? (
          <PublicPublishWatermark
            show
            removeHref={`/dashboard?pay=${encodeURIComponent(slug)}`}
          />
        ) : null}
      </div>
    </div>
  );
}
