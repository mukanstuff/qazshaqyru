import type { PublishStep } from '@/components/publish/PublishStepper';

/** 3-step flow: create → guests → pay (or guests when payment is not required). */
export function resolvePublishStep(params: {
  isPublished: boolean;
  isLoggedIn: boolean;
  needsPayment: boolean;
  paymentPending?: boolean;
  wizardMode?: boolean;
  guestCount?: number;
}): PublishStep {
  if (params.isPublished) return params.needsPayment ? 'pay' : 'guests';
  if (!params.isLoggedIn) return 'create';
  if (params.wizardMode) return params.needsPayment ? 'pay' : 'guests';
  if (params.paymentPending) return params.needsPayment ? 'pay' : 'guests';
  if ((params.guestCount ?? 0) === 0) return 'guests';
  return params.needsPayment ? 'pay' : 'guests';
}
