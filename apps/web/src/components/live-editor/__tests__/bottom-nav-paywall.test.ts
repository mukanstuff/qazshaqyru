import { describe, expect, it } from 'vitest';
import { LIVE_EDITOR_MOBILE_TABS } from '@/components/live-editor/LiveEditorBottomNav';
import { canPublishWithoutPayment } from '@/lib/invitations/publish-watermark';

describe('live editor mobile nav (paywall timing)', () => {
  it('exposes only edit + preview tabs — publish is not a mode tab', () => {
    expect(LIVE_EDITOR_MOBILE_TABS).toEqual(['edit', 'preview']);
    expect(LIVE_EDITOR_MOBILE_TABS).not.toContain('publish');
  });
});

describe('freemium publish (P0-5 — owner model update)', () => {
  it('NO freemium publish: canPublishWithoutPayment is false (pay template = full access)', () => {
    // 2026-07-30: per PRODUCT_MODEL_AND_RULES.md — publish only after paying template price.
    // canPublishWithoutPayment must return false for user paths.
    expect(canPublishWithoutPayment()).toBe(false);
  });
});
