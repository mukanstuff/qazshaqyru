import fs from 'fs';
import path from 'path';
import type { Locale } from '@/i18n/shared';

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
}

export interface BlogPost extends BlogPostMeta {
  bodyHtml: string;
}

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'blog');

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw.trim() };

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    data[key] = value;
  }
  return { data, body: match[2].trim() };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(
    /\[([^\]]+)\]\(((?:https?:[^)\s]+|\/[^)\s]+))\)/g,
    '<a href="$2" class="text-us-accent hover:underline" rel="noopener noreferrer">$1</a>'
  );
  return out;
}

/** Minimal markdown → HTML for trusted in-repo posts (no deps). */
export function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const parts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      parts.push(`<h2 class="font-display text-xl font-medium text-us-ink mt-8 mb-3">${inlineFormat(line.slice(3))}</h2>`);
      i += 1;
      continue;
    }

    if (line.startsWith('# ')) {
      parts.push(`<h1 class="font-display text-2xl font-semibold text-us-ink mt-8 mb-3">${inlineFormat(line.slice(2))}</h1>`);
      i += 1;
      continue;
    }

    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${inlineFormat(lines[i].replace(/^[-*] /, ''))}</li>`);
        i += 1;
      }
      parts.push(`<ul class="list-disc space-y-2 pl-5 my-4">${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${inlineFormat(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i += 1;
      }
      parts.push(`<ol class="list-decimal space-y-2 pl-5 my-4">${items.join('')}</ol>`);
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !/^[-*] /.test(lines[i]) && !/^\d+\. /.test(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    parts.push(`<p class="my-4">${inlineFormat(para.join(' '))}</p>`);
  }

  return parts.join('\n');
}

function localeDir(locale: Locale): string {
  return path.join(CONTENT_ROOT, locale === 'kz' ? 'kz' : 'ru');
}

function readPostFile(locale: Locale, slug: string): BlogPost | null {
  const filePath = path.join(localeDir(locale), `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    if (locale !== 'ru') return readPostFile('ru', slug);
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    date: data.date ?? '',
    updated: data.updated || data.date || '',
    bodyHtml: markdownToHtml(body),
  };
}

export function listBlogPosts(locale: Locale): BlogPostMeta[] {
  const dir = localeDir(locale);
  if (!fs.existsSync(dir)) {
    if (locale !== 'ru') return listBlogPosts('ru');
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      const post = readPostFile(locale, slug);
      if (!post) return null;
      const meta: BlogPostMeta = {
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        ...(post.updated ? { updated: post.updated } : {}),
      };
      return meta;
    })
    .filter((p): p is BlogPostMeta => p !== null)
    .sort((a: BlogPostMeta, b: BlogPostMeta) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getBlogPost(locale: Locale, slug: string): BlogPost | null {
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  return readPostFile(locale, slug);
}

export function listAllBlogSlugs(): string[] {
  const ru = listBlogPosts('ru').map((p) => p.slug);
  const kz = listBlogPosts('kz').map((p) => p.slug);
  return Array.from(new Set([...ru, ...kz]));
}
