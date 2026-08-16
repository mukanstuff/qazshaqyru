import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import prisma from '@/lib/shared/db';
import { applyRateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from '@/lib/shared/api';
import { getTemplate } from '@/lib/templates';
import { DEFAULT_TEMPLATE_SLUG } from '@/lib/templates/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OgInvitationData {
  title: string;
  eventType: string;
  eventDate: Date;
  eventTime: string | null;
  eventPlace: string | null;
  templateKey: string;
  updatedAt: Date;
}

const DEMO_OG: OgInvitationData = {
  title: 'Асет & Айым',
  eventType: 'Свадьба',
  eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  eventTime: '15:00',
  eventPlace: 'Ресторан «Жарық»',
  templateKey: DEFAULT_TEMPLATE_SLUG,
  updatedAt: new Date(),
};

function resolveAbsoluteUrl(path: string, origin: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (process.env.APP_URL || origin).replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Open Graph image generator — optimized for WhatsApp / Telegram link previews.
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

    const origin = request.nextUrl.origin;
    let data: OgInvitationData | null = null;

    if (slug === 'demo') {
      const layout = searchParams.get('layout');
      data = {
        ...DEMO_OG,
        templateKey: layout && /^[a-zA-Z0-9_-]{1,80}$/.test(layout) ? layout : DEMO_OG.templateKey,
      };
    } else {
      const invitation = await prisma.invitation.findFirst({
        where: { slug, status: 'published' },
        select: {
          title: true,
          eventType: true,
          eventDate: true,
          eventTime: true,
          eventPlace: true,
          templateKey: true,
          updatedAt: true,
        },
      });
      if (!invitation) return new Response('Not found', { status: 404 });
      data = {
        ...invitation,
        templateKey: invitation.templateKey || DEFAULT_TEMPLATE_SLUG,
      };
    }
    if (!data) return new Response('Not found', { status: 404 });

    const cfg = getTemplate(data.templateKey);
    if (!cfg) return new Response('Template config not found', { status: 400 });
    const coverUrl = resolveAbsoluteUrl(cfg.coverUrl, origin);
    const dateStr = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(data.eventDate));

    const etag = `"${data.updatedAt.getTime()}"`;
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    const accent = cfg.accent || '#C5A368';
    const isDark = cfg.layout === 'dark-lux';
    const textColor = isDark ? '#F5F2ED' : '#3D3530';
    const subColor = isDark ? 'rgba(245,242,237,0.75)' : 'rgba(61,53,48,0.7)';

    const response = new ImageResponse(
      (
        <div
          
        >
          <img
            src={coverUrl}
            alt=""
            width={1200}
            height={630}
            
          />
          <div
            
          />
          <div
            
          >
            <div
              
            >
              {data.eventType}
            </div>
            <div
              
            >
              {data.title}
            </div>
            <div
              
            >
              <span>{dateStr}</span>
              {data.eventTime ? (
                <>
                  <span >·</span>
                  <span>{data.eventTime}</span>
                </>
              ) : null}
            </div>
            {data.eventPlace ? (
              <div
                
              >
                {data.eventPlace}
              </div>
            ) : null}
            <div
              
            >
              QazShaqyru
            </div>
          </div>
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
