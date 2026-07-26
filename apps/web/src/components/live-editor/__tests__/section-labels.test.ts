import { describe, expect, it } from 'vitest';
import { getSectionLabel, shouldRenderEditorToolbar } from '../section-labels';

describe('getSectionLabel', () => {
  const mockT = (key: string) => key;

  it('returns human label for known section types', () => {
    // In actual app, it will look up in i18n, but here we just check if it doesn't crash
    // and returns the key or fallback.
    expect(getSectionLabel('hero-names', 'hero-names', mockT)).toBe('liveEditor.sections.heroNames');
    expect(getSectionLabel('cover-photo', 'cover-photo', mockT)).toBe('liveEditor.sections.photo');
  });

  it('falls back to id for unknown types', () => {
    expect(getSectionLabel('custom-block', 'custom-block-1', mockT)).toBe('custom-block-1');
  });
});

describe('shouldRenderEditorToolbar', () => {
  it('hides legacy toolbar in live embed preview', () => {
    expect(
      shouldRenderEditorToolbar({ isEditing: true, previewEmbedFrame: true }),
    ).toBe(false);
  });

  it('keeps toolbar for classic full-page editor', () => {
    expect(
      shouldRenderEditorToolbar({ isEditing: true, previewEmbedFrame: false }),
    ).toBe(true);
  });

  it('never shows toolbar when not editing', () => {
    expect(
      shouldRenderEditorToolbar({ isEditing: false, previewEmbedFrame: false }),
    ).toBe(false);
  });
});
