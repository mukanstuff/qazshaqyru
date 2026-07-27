import { describe, it, expect } from 'vitest';
import { parseTemplateDataInput } from '@/lib/templates/template-data-schema';

describe('template data schema', () => {
  it('accepts local upload URLs', () => {
    const data = parseTemplateDataInput({
      couplePhoto1: '/uploads/invitations/abc/photo.jpg',
      backgroundImage: '/uploads/invitations/xyz/bg.png',
    });
    expect(data.couplePhoto1).toBe('/uploads/invitations/abc/photo.jpg');
  });

  it('allows Unsplash stock images for template fields', () => {
    const data = parseTemplateDataInput({
      backgroundImage: 'https://images.unsplash.com/photo-123?w=800',
    });
    expect(data.backgroundImage).toContain('unsplash.com');
  });

  it('rejects external URLs', () => {
    expect(() =>
      parseTemplateDataInput({
        couplePhoto1: 'https://evil.example.com/steal.jpg',
      }),
    ).toThrow();
  });
});
