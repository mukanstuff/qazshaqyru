import { describe, expect, it } from 'vitest';
import { getSectionLabel, shouldRenderEditorToolbar } from '../section-labels';

describe('getSectionLabel', () => {
  it('returns human label for known section types', () => {
    expect(getSectionLabel('hero-names', 'hero-names')).toBe('Имена');
    expect(getSectionLabel('cover-photo', 'cover-photo')).toBe('Обложка');
  });

  it('falls back to id for unknown types', () => {
    expect(getSectionLabel('custom-block', 'custom-block-1')).toBe('custom-block-1');
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
