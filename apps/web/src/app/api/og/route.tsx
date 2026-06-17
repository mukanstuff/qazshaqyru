import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { applyRateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Open Graph image generator.
 *
 * Performance: OG images are expensive to render (satori + resvg). We
 * send long-lived Cache-Control + ETag headers so that social media
 * crawlers (and any browser preview) can serve from their own caches
 * instead of hitting the app on every share.
 *
 * Security: rate-limited per IP. Each /api/og render is ~500ms of CPU
 * and several MB of memory, so we don't want a script to be able to
 * flood us with image requests.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request) || 'unknown';
    const rate = await applyRateLimit(request, `og:${ip}`, RATE_LIMITS.OG_IMAGE);
    if (!rate.allowed) return rateLimitResponse(rate);

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) return new Response('Missing slug', { status: 400 });

    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(slug)) {
      return new Response('Invalid slug', { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { slug },
      select: {
        title: true,
        eventType: true,
        eventDate: true,
        eventTime: true,
        eventPlace: true,
        updatedAt: true,
      },
    });

    if (!invitation) return new Response('Not found', { status: 404 });

    const eventDate = new Date(invitation.eventDate);
    const dateStr = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(eventDate);

    // ETag is the updatedAt timestamp - any edit invalidates the cache.
    const etag = `"${invitation.updatedAt.getTime()}"`;

    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    const response = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
            color: 'white',
            fontFamily: 'system-ui',
            padding: '60px',
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#c9a96e',
              marginBottom: 30,
              display: 'flex',
            }}
          >
            {invitation.eventType}
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 300,
              lineHeight: 1.1,
              textAlign: 'center',
              marginBottom: 40,
              maxWidth: '90%',
              display: 'flex',
            }}
          >
            {invitation.title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
            }}
          >
            {dateStr}
            {invitation.eventTime ? ` · ${invitation.eventTime}` : ''}
          </div>
          {invitation.eventPlace && (
            <div
              style={{
                fontSize: 18,
                color: 'rgba(255,255,255,0.4)',
                marginTop: 12,
                display: 'flex',
              }}
            >
              {invitation.eventPlace}
            </div>
          )}
        </div>
      ),
      { width: 1200, height: 630 }
    );

    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    response.headers.set('ETag', etag);
    return response;
  } catch {
    return new Response('Failed to generate image', { status: 500 });
  }
}
