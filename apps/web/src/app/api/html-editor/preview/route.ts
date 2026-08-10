/**
 * HTML-template editor — live preview API.
 *
 * POST /api/html-editor/preview
 *
 * Renders the HTML template with current editor field values.
 * No auth required — reads demo data. Used for the live preview iframe
 * inside the editor shell.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHtmlTemplateDescriptor } from '@/lib/templates/manifests';
import { renderHtmlTemplate } from '@/lib/templates/html-engine';
import { htmlEditorFieldsSchema } from '@/lib/templates/html-engine/editor/schemas';
import type { HtmlTemplateData, Locale } from '@/lib/templates/html-engine/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = htmlEditorFieldsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation error' },
      { status: 400 }
    );
  }

  const rawData = parsed.data;
  const templateSlug: string = (rawData as Record<string, unknown>).templateSlug as string ?? 'hello-world';
  const locale: Locale = ((rawData as Record<string, unknown>).locale as Locale) ?? 'ru';
  const f = rawData;

  const descriptor = getHtmlTemplateDescriptor(templateSlug);
  if (!descriptor) {
    return NextResponse.json({ ok: false, error: 'Template not found' }, { status: 404 });
  }

  // Build the template data from editor fields
  const templateData: HtmlTemplateData = {
    locale,
    fields: {
      groomName: f.groomName || 'Нурлан',
      brideName: f.brideName || 'Айгерим',
      eventDate: f.eventDate || '2027-05-15',
      eventTime: f.eventTime || '18:00',
      eventPlace: f.eventPlace || 'Ресторан «Жарық»',
      address: f.address || '',
      greeting: f.greeting || '',
    },
    musicUrl: f.musicUrl || null,
    assets: buildAssetMap(f, descriptor.assetsDir),
    defaults: {},
  };

  const rendered = renderHtmlTemplate(descriptor, templateData, {
    title: `${f.groomName} & ${f.brideName}`,
  });

  if (!rendered.ok) {
    return NextResponse.json({ ok: false, error: rendered.error }, { status: 500 });
  }

  // Inject design overrides as CSS variables
  const html = injectDesignVars(rendered.html, f);

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function buildAssetMap(
  fields: Record<string, unknown>,
  assetsDir: string,
): Record<string, string> {
  const map: Record<string, string> = {};
  const gallery = (fields.galleryPhotos as string[] | undefined) ?? [];
  gallery.forEach((url, i) => {
    map[`gallery_${i}`] = url;
  });
  if (fields.cardImageUrl) {
    map['card_image'] = fields.cardImageUrl as string;
  }
  return map;
}

function injectDesignVars(html: string, fields: Record<string, unknown>): string {
  const vars: string[] = [];

  if (fields.backgroundColor) {
    vars.push(`--inv-bg: ${fields.backgroundColor};`);
  }
  if (fields.accentColorMode === 'custom' && fields.accentColor) {
    vars.push(`--inv-accent: ${fields.accentColor};`);
  }
  if (fields.fontMode === 'custom' && fields.fontFamily) {
    vars.push(`--inv-font: '${fields.fontFamily}', serif;`);
  }
  if (fields.animationType && fields.animationType !== 'none') {
    vars.push(`--inv-anim: ${fields.animationType};`);
    vars.push(`--inv-anim-dur: ${fields.animationDuration ?? 3}s;`);
  }
  vars.push(`--inv-scroll: ${fields.autoScroll === false ? 'manual' : 'auto'};`);
  vars.push(`--inv-envelope: ${fields.showEnvelope === false ? 'hide' : 'show'};`);

  if (vars.length === 0) return html;

  const css = `:root { ${vars.join(' ')} }`;
  return html.replace(
    /(<head[^>]*>)([\s\S]*?)(<\/head>)/i,
    (_full, open, inner, close) => `${open}${inner}\n<style>${css}</style>\n${close}`
  );
}
