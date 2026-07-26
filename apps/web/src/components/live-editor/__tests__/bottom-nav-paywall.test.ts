import { describe, expect, it } from 'vitest';
import { LIVE_EDITOR_MOBILE_TABS } from '@/components/live-editor/LiveEditorBottomNav';
import { canPublishWithoutPayment } from '@/lib/invitations/publish-watermark';

describe('live editor mobile nav (paywall timing)', () => {
  it('exposes only edit + preview tabs — publish is not a mode tab', () => {
    expect(LIVE_EDITOR_MOBILE_TABS).toEqual(['edit', 'preview']);
    expect(LIVE_EDITOR_MOBILE_TABS).not.toContain('publish');
  });
});

describe('freemium publish', () => {
  it('allows publish without payment (watermark path)', () => {
    expect(canPublishWithoutPayment()).toBe(true);
  });
});
