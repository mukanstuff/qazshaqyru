import { NextResponse } from 'next/server';
import { buildSitemapEntries, renderSitemapXml } from '@/lib/seo/sitemap';
import { getSiteOrigin } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = buildSitemapEntries({ baseUrl: getSiteOrigin() });
  const xml = renderSitemapXml(entries);

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
