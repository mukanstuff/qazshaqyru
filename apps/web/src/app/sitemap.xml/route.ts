import { NextResponse } from 'next/server';
import { buildSitemapEntries, renderSitemapXml } from '@/lib/seo/sitemap';
import { getSiteOrigin } from '@/lib/seo/site';
import { getCategoryCounts } from '@/lib/landing/category-counts';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Only categories that actually hold templates are advertised.
  //
  // Empty categories render with `noindex`, so listing them here asked crawlers
  // to fetch pages we then tell them to ignore — 24 of the 27 category URLs in
  // the sitemap were in exactly that state. Deriving the list from the
  // catalogue keeps the sitemap and the page metadata telling the same story,
  // with no constant to remember to update.
  const counts = await getCategoryCounts();
  const liveCategories = Object.keys(counts);

  const entries = buildSitemapEntries({ baseUrl: getSiteOrigin(), liveCategories });
  const xml = renderSitemapXml(entries);

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
