'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary for errors thrown by the ROOT layout itself.
 *
 * `app/error.tsx` only catches errors below the root layout — if the layout
 * throws (a bad cookie read, a failed i18n load, a provider blowing up), Next
 * falls through to its own unstyled default page, which in production is a bare
 * white screen reading "Application error: a client-side exception has
 * occurred". There was no global-error.tsx at all.
 *
 * This file replaces the root <html> wholesale, so it cannot use the app's
 * providers, layout or i18n context — the styles are inline and both languages
 * are shown side by side rather than picking one we cannot resolve here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/global-error]', error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#fcfcfb',
          color: '#1f2a24',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#16A34A' }}>QazShaqyru</p>
          <h1 style={{ margin: '16px 0 8px', fontSize: 22, fontWeight: 600 }}>
            Что-то пошло не так · Бірдеңе дұрыс болмады
          </h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'rgba(31,42,36,0.65)' }}>
            Попробуйте обновить страницу. · Бетті жаңартып көріңіз.
          </p>
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 44,
                padding: '0 20px',
                borderRadius: 999,
                border: 'none',
                background: '#16A34A',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Обновить · Жаңарту
            </button>
            <a
              href="/"
              style={{
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 20px',
                borderRadius: 999,
                border: '1px solid rgba(31,42,36,0.18)',
                color: '#1f2a24',
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              На главную · Басты бет
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
