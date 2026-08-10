'use client';

import { useMemo } from 'react';

/**
 * Renders an HTML template inside a phone frame with dark Figma-like background.
 *
 * Structure: outer container (dark bg, centered via parent flex) → phone bezel →
 * screen (black) → iframe (template content + grid centering).
 *
 * The iframe does NOT have min-height: 100vh — it sizes to the screen div.
 * Template body {} grid centering keeps the card centered inside the screen.
 */
interface HtmlTemplateFrameProps {
  /** Full HTML document string (from renderHtmlTemplate). */
  html: string;
  /** CSS className for the outer container. */
  className?: string;
  /** iframe width in pixels. Defaults to 390 (iPhone 14). */
  width?: number;
  /** iframe height in pixels. Defaults to 844 (iPhone 14). */
  height?: number;
}

export default function HtmlTemplateFrame({
  html,
  className = '',
  width = 390,
  height = 844,
}: HtmlTemplateFrameProps) {
  // Inject grid centering override so the template stays centered
  // in the phone screen regardless of its own body {} rules.
  // No injection needed — the template's own body { background: #f5f0e8 } fills the screen.
  const framedHtml = html;

  return (
    <div
      style={{
        background: '#1c1c1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      {/* Phone frame (bezel) */}
      <div
        style={{
          width: `${width + 24}px`,
          background: '#0d0d0d',
          borderRadius: '54px',
          padding: '12px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 96px rgba(0,0,0,0.9)',
        }}
      >
        {/* Screen: clips iframe + notch */}
        <div
          style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: '38px',
            background: '#000',
            overflow: 'hidden',
          }}
        >
          {/* iframe — fills the screen; JS makes bg transparent after load */}
          <iframe
            srcDoc={framedHtml}
            title="Приглашение"
            allow="fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
          {/* Notch */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '126px',
              height: '34px',
              background: '#0d0d0d',
              borderRadius: '0 0 20px 20px',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
