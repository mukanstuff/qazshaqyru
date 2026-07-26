import { describe, expect, it } from 'vitest';
import { markdownToHtml, listBlogPosts, getBlogPost } from '@/lib/blog/posts';

describe('blog markdown', () => {
  it('renders headings, lists and bold', () => {
    const html = markdownToHtml('## Title\n\nHello **world**\n\n1. One\n2. Two\n');
    expect(html).toContain('<h2');
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('<ol');
    expect(html).toContain('<li>One</li>');
  });

  it('lists starter posts for ru and kz', () => {
    const ru = listBlogPosts('ru');
    const kz = listBlogPosts('kz');
    expect(ru.length).toBeGreaterThanOrEqual(12);
    expect(kz.length).toBeGreaterThanOrEqual(12);
    expect(ru.map((p) => p.slug)).toEqual(
      expect.arrayContaining([
        'send-whatsapp',
        'invitation-text',
        'rsvp-without-calls',
        'betashar-kudalyk',
        'tusaukeser-text',
        'kaspi-payment-refund',
        'honest-comparison',
      ])
    );
  });

  it('loads a post by slug', () => {
    const post = getBlogPost('ru', 'send-whatsapp');
    expect(post).not.toBeNull();
    expect(post?.title).toMatch(/WhatsApp/i);
    expect(post?.bodyHtml.length).toBeGreaterThan(40);
  });
});
