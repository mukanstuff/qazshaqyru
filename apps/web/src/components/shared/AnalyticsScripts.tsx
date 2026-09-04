import { headers } from 'next/headers';

/**
 * Yandex Metrika — off by default, turns on the moment NEXT_PUBLIC_YANDEX_METRIKA_ID
 * is set (no code change needed at go-live). Kazakhstan search/ad traffic is
 * disproportionately Yandex, and unlike GA it isn't blocked by default in RU/KZ.
 *
 * Reads the per-request CSP nonce middleware already generates in production
 * (`x-nonce` header) so the inline bootstrap script isn't blocked by
 * `script-src 'nonce-...' 'strict-dynamic'`.
 */
export async function AnalyticsScripts() {
  const counterId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID?.trim();
  if (!counterId || !/^\d+$/.test(counterId)) return null;

  const headerStore = await headers();
  const nonce = headerStore.get('x-nonce') ?? undefined;

  return (
    <>
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${counterId}, "init", {clickmap:true, trackLinks:true, accurateTrackBounce:true});`,
        }}
      />
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${counterId}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
