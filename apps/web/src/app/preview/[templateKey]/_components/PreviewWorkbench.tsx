'use client';

import { useEffect } from 'react';
import { InvitationLayoutRouter } from '@/components/invitation-layouts/LayoutRouter';
import { PreviewDeviceFrame } from './PreviewDeviceFrame';
import { PreviewFloatingBack } from './PreviewFloatingBack';
import { PreviewFloatingEdit } from './PreviewFloatingEdit';

interface Props {
  templateSlug: string;
  templateTitle: string;
  backHref: string;
  editHref: string;
}

export function PreviewWorkbench({
  templateSlug,
  templateTitle,
  backHref,
  editHref,
}: Props) {
  // Force dark background on html, body, and root div — covers ALL gaps
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.background = '#0a0a0c';
    body.style.background = '#0a0a0c';
    // Also find the div between body and main (Next.js wraps in a div)
    const nextDiv = body.firstElementChild as HTMLElement | null;
    if (nextDiv) {
      nextDiv.style.background = '#0a0a0c';
    }
    document.documentElement.style.backgroundColor = '#0a0a0c';
    return () => {
      html.style.background = '';
      body.style.background = '';
      if (nextDiv) nextDiv.style.background = '';
    };
  }, []);

  return (
    <main className="preview-root">
      <div className="preview-back">
        <PreviewFloatingBack href={backHref} />
      </div>

      <div className="preview-stage">
        <PreviewDeviceFrame>
          <InvitationLayoutRouter
            slug="demo"
            guestToken={null}
            familyToken={null}
            demoLayout={templateSlug}
            suppressGuestChrome
            previewChrome="framed"
          />
        </PreviewDeviceFrame>
      </div>

      <div className="preview-edit">
        <PreviewFloatingEdit href={editHref} title={templateTitle} />
      </div>
    </main>
  );
}
