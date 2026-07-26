'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { useI18n } from '@/i18n';
import { type PlanSku } from '@/lib/entitlements/plan-catalog';
import { cn } from '@/lib/shared/utils';

const FEATURE_FAQ: Array<{
  labelKey: string;
  skus: PlanSku[];
}> = [
  { labelKey: 'matrixPublish', skus: ['free', 'standard', 'premium', 'agency'] },
  { labelKey: 'matrixNoLogo', skus: ['standard', 'premium', 'agency'] },
  { labelKey: 'matrixGuestList', skus: ['standard', 'premium', 'agency'] },
  { labelKey: 'matrixSeating', skus: ['standard', 'premium', 'agency'] },
  { labelKey: 'matrixReminders', skus: ['standard', 'premium', 'agency'] },
  { labelKey: 'matrixRestaurantList', skus: ['standard', 'premium', 'agency'] },
  { labelKey: 'matrixRestaurantLink', skus: ['standard', 'premium', 'agency'] },
  { labelKey: 'matrixSlug', skus: ['premium', 'agency'] },
  { labelKey: 'matrixUnlimited', skus: ['agency'] },
];

const PLAN_NAME_KEYS: Record<PlanSku, string> = {
  free: 'freeName',
  standard: 'standardName',
  premium: 'premiumName',
  agency: 'agencyName',
};

/** Accordion FAQ for plan features — replaces the comparison matrix table. */
export function PricingFeatureFaq() {
  const { t } = useI18n();
  const [openKey, setOpenKey] = useState<string | null>(FEATURE_FAQ[0]?.labelKey ?? null);

  return (
    <div className="mx-auto max-w-2xl" data-testid="pricing-feature-faq">
      <h2 className="mb-6 text-center font-display text-2xl text-us-ink">
        {t('landing.v2.pricing.page.featuresTitle')}
      </h2>
      <div className="divide-y divide-us-border/70 rounded-2xl border border-black/[0.06] bg-white">
        {FEATURE_FAQ.map((item) => {
          const isOpen = openKey === item.labelKey;
          const panelId = `pricing-faq-${item.labelKey}`;
          const planLabels = item.skus
            .map((sku) => t(`landing.v2.pricing.${PLAN_NAME_KEYS[sku]}`))
            .join(', ');

          return (
            <div key={item.labelKey}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenKey(isOpen ? null : item.labelKey)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className="font-display text-base text-us-ink">
                  {t(`landing.v2.pricing.${item.labelKey}`)}
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'shrink-0 text-us-ink-muted transition-transform',
                    isOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <p
                  id={panelId}
                  role="region"
                  className="px-5 pb-4 text-sm leading-relaxed text-us-ink-muted"
                >
                  {t('landing.v2.pricing.page.featureIncluded', { plans: planLabels })}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
