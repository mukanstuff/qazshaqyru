import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import prisma from '@/lib/shared/db';
import { applyRateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from '@/lib/shared/api';
import { EVENT_TYPE_LABELS, type EventType } from '@/lib/shared/types';
import { formatEventDateLine } from '@/lib/shared/kazakh-datetime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OgInvitationData {
  title: string;
  eventType: EventType;
  eventDate: Date;
  eventTime: string | null;
  eventPlace: string | null;
  locale: 'ru' | 'kz';
  coverUrl: string | null;
  updatedAt: Date;
}

function resolveAbsoluteUrl(target: string, origin: string): string {
  if (target.startsWith('http://') || target.startsWith('https://')) return target;
  const base = (process.env.APP_URL || origin).replace(/\/$/, '');
  return `${base}${target.startsWith('/') ? target : `/${target}`}`;
}

/**
 * Fonts for the share image.
 *
 * ImageResponse was called with no `fonts` at all, so @vercel/og fell back to
 * its bundled noto-sans-**latin** — a font with no Cyrillic coverage. Every
 * name, date and venue on a Kazakh or Russian invitation would have rendered as
 * empty boxes in the WhatsApp/Telegram preview, which is the one image this
 * product exists to produce. (The `fontFamily: '"Onest", "Segoe UI"'` in the
 * markup below was decorative — Satori only knows the fonts passed here.)
 *
 * Noto Sans covers Latin, Cyrillic and the Kazakh letters ә ғ қ ң ө ұ ү һ і.
 *
 * Loaded through `new URL(..., import.meta.url)` rather than fs.readFile from
 * process.cwd(): the production image is built with `output: 'standalone'` and
 * the Dockerfile copies only public/, .next/, prisma/, scripts/ and content/ —
 * anything read from a source path at runtime simply would not be there. This
 * form makes webpack emit the files as build assets next to the route.
 * Resolved once per process; ~550 KB each and they never change.
 */
let ogFontsPromise: Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[]
> | null = null;

function loadOgFonts() {
  ogFontsPromise ??= Promise.all([
    fetch(new URL('./fonts/NotoSans-Regular.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL('./fonts/NotoSans-Bold.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
  ]).then(([regular, bold]) => [
    { name: 'Noto Sans', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Noto Sans', data: bold, weight: 700 as const, style: 'normal' as const },
  ]);
  return ogFontsPromise;
}

/**
 * Open Graph image generator — optimized for WhatsApp / Telegram link previews.
 */
export async function GET(request: NextRequest) {
  // Captured outside the try so the catch below can still reach it.
  let coverUrlForFallback: string | null = null;
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
    const invitation = await prisma.invitation.findFirst({
      where: { slug, status: 'published' },
      select: {
        title: true,
        eventType: true,
        eventDate: true,
        eventTime: true,
        eventPlace: true,
        updatedAt: true,
        user: { select: { language: true } },
        template: { select: { previewImageUrl: true } },
      },
    });
    if (!invitation) return new Response('Not found', { status: 404 });

    const data: OgInvitationData = {
      title: invitation.title,
      eventType: invitation.eventType as EventType,
      eventDate: invitation.eventDate,
      eventTime: invitation.eventTime,
      eventPlace: invitation.eventPlace,
      locale: invitation.user?.language === 'kz' ? 'kz' : 'ru',
      coverUrl: invitation.template?.previewImageUrl ?? null,
      updatedAt: invitation.updatedAt,
    };

    const coverUrl = resolveAbsoluteUrl(data.coverUrl || '/og-default.png', origin);
    coverUrlForFallback = coverUrl;
    const dateStr = formatEventDateLine(new Date(data.eventDate), data.locale);
    const eventTypeLabel = EVENT_TYPE_LABELS[data.eventType]?.[data.locale] ?? EVENT_TYPE_LABELS.wedding[data.locale];

    const etag = `"${data.updatedAt.getTime()}"`;
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    const response = new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: 1200,
            height: 630,
            fontFamily: 'Noto Sans',
          }}
        >
          <img
            src={coverUrl}
            alt=""
            width={1200}
            height={630}
            style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: 'flex',
              background: 'linear-gradient(180deg, rgba(15,26,20,0.15) 0%, rgba(15,26,20,0.35) 45%, rgba(15,26,20,0.92) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 1200,
              display: 'flex',
              flexDirection: 'column',
              padding: '0 64px 56px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 999,
                padding: '8px 22px',
                marginBottom: 22,
                color: '#F5F8F5',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {eventTypeLabel}
            </div>
            <div
              style={{
                display: 'flex',
                color: '#FFFFFF',
                fontSize: 68,
                fontWeight: 700,
                lineHeight: 1.08,
                marginBottom: 20,
                maxWidth: 1000,
              }}
            >
              {data.title}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.92)',
                fontSize: 32,
                fontWeight: 500,
                gap: 16,
              }}
            >
              <span style={{ display: 'flex' }}>{dateStr}</span>
              {data.eventTime ? (
                <>
                  <span style={{ display: 'flex', color: '#55C97F' }}>·</span>
                  <span style={{ display: 'flex' }}>{data.eventTime}</span>
                </>
              ) : null}
            </div>
            {data.eventPlace ? (
              <div
                style={{
                  display: 'flex',
                  marginTop: 10,
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: 26,
                }}
              >
                {data.eventPlace}
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                marginTop: 32,
                color: '#55C97F',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              QazShaqyru
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts: await loadOgFonts() }
    );

    // Materialise the PNG here rather than handing the stream back to Next.
    // ImageResponse does its real work lazily while the body is piped, so a
    // rendering failure (font loading, most often) surfaced as Next's
    // "failed to pipe response" *after* this handler had already returned —
    // outside the try/catch, producing a bare 500 and no link preview at all.
    const png = await response.arrayBuffer();

    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control':
          'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
        ETag: etag,
      },
    });
  } catch (error) {
    /*
     * Rendering can fail for reasons that have nothing to do with the
     * invitation — most of all font loading inside @vercel/og. Returning a bare
     * 500 means WhatsApp and Telegram show a link with NO preview image at all,
     * which is the worst possible outcome for the one artefact this product
     * exists to hand out. Fall back to the template's own preview artwork:
     * no names on it, but a real, on-brand picture.
     */
    console.error('[og] falling back to template preview:', error);
    const fallback = coverUrlForFallback ?? resolveAbsoluteUrl('/og-default.png', request.nextUrl.origin);
    return Response.redirect(fallback, 302);
  }
}
