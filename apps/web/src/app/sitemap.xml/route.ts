import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const staticPages = ['', '/login', '/terms', '/privacy'];

  let templatePages: { slug: string; updatedAt: Date }[] = [];
  try {
    templatePages = await prisma.template.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
  } catch {
    // DB not ready — return static-only sitemap
  }

  const urls = [
    ...staticPages.map((p) => ({
      loc: `${baseUrl}${p}`,
      changefreq: p === '' ? 'weekly' : 'monthly',
      priority: p === '' ? 1.0 : 0.7,
    })),
    ...templatePages.map((t) => ({
      loc: `${baseUrl}/templates/${t.slug}`,
      lastmod: t.updatedAt.toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n${'lastmod' in u && u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
