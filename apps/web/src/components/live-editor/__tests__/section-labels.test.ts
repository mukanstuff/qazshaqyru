import { describe, expect, it } from 'vitest';
import { getSectionLabel, shouldRenderEditorToolbar } from '../section-labels';

describe('getSectionLabel', () => {
  const mockT = (key: string) => key;

  it('returns human label for known section types', () => {
    // In actual app, it will look up in i18n, but here we just check if it doesn't crash
    // and returns the key or fallback.
    // mockT returns the key verbatim, which means "no translation available"
    // → getSectionLabel falls back to a human-readable Russian label.
    expect(getSectionLabel('hero-names', 'hero-names', mockT)).toBe('Имена');
    expect(getSectionLabel('cover-photo', 'cover-photo', mockT)).toBe('Обложка');
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
