/**

 * Phase 4 spike: render toi-style HTML templates in a sandboxed iframe.

 * New template = html file + assets folder, NOT new React section CSS.

 *

 * Usage (future):

 *   <HtmlTemplateRenderer manifest={htmlManifest} data={editData} />

 */

'use client';



import { useEffect, useRef, useState } from 'react';

import type { HtmlTemplateManifest } from './manifest-types';



export interface HtmlTemplateData {

  /** data-edit-id → value */

  edits: Record<string, string>;

  locale: 'kk' | 'ru';

  /** data-bind widgets: countdown, date, map, gallery, music */

  binds?: Record<string, string>;

}



interface Props {

  manifest: HtmlTemplateManifest;

  data: HtmlTemplateData;

  className?: string;

}



/**

 * Loads raw HTML template, injects field values via data-edit-id attributes,

 * renders inside sandboxed iframe (no scripts from template).

 */

export function HtmlTemplateRenderer({ manifest, data, className }: Props) {

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [html, setHtml] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    let cancelled = false;

    (async () => {

      try {

        const res = await fetch(manifest.htmlPath);

        if (!res.ok) throw new Error(`Template HTML not found: ${manifest.htmlPath}`);

        let raw = await res.text();

        for (const [id, value] of Object.entries(data.edits)) {

          const attr = `data-edit-id="${id}"`;

          const regex = new RegExp(

            `(<[^>]*${attr}[^>]*>)([^<]*)(</[^>]+>)`,

            'g',

          );

          raw = raw.replace(regex, `$1${value}$3`);

        }

        if (!cancelled) setHtml(raw);

      } catch (e) {

        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');

      }

    })();

    return () => {

      cancelled = true;

    };

  }, [manifest.htmlPath, data.edits]);



  useEffect(() => {

    if (!html || !iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;

    if (!doc) return;

    doc.open();

    doc.write(html);

    doc.close();

  }, [html]);



  if (error) {

    return (

      <div className={className} role="alert">

        HTML template: {error}

      </div>

    );

  }



  return (

    <iframe

      ref={iframeRef}

      title={`Template ${manifest.slug}`}

      className={className}

      sandbox="allow-same-origin"

      style={{ width: '100%', maxWidth: 430, minHeight: '100dvh', border: 'none' }}

    />

  );

}



/** Pilot manifest for uzatu/template23 spike — wire when HTML asset is bundled. */

export const TOI_TEMPLATE23_HTML_MANIFEST: HtmlTemplateManifest = {

  slug: 'uzatu-template23',

  tier: 'HTML',

  htmlPath: '/template-html/uzatu-template23.html',

  assetsDir: '/template-assets/uzatu-template23',

};


