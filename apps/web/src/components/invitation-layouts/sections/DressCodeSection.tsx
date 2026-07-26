'use client';

import { boundField, type SectionProps } from './types';

function FramedInner({
  ctx,
  frameKey,
  className,
  children,
}: {
  ctx: SectionProps['ctx'];
  frameKey?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const bg = frameKey ? ctx.assetUrl(frameKey) : null;
  return (
    <div
      className={`inv-framed${className ? ` ${className}` : ''}`}
      style={
        bg
          ? {
              backgroundImage: `url(${bg})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function DressCodeSection({ ctx, bindings }: SectionProps) {
  const isKz = ctx.invitation.language === 'kz';
  const title = boundField(bindings, 'title', ctx.fields) || (isKz ? 'Киім коды' : 'Дресс-код');
  const note = boundField(bindings, 'note', ctx.fields);
  const art = ctx.assetUrl('dressArt');

  if (!note) return null;

  return (
    <section className="inv-section inv-manifest-dress" data-section="dress-code">
      <FramedInner ctx={ctx} frameKey="frameGreeting" className="inv-framed--greeting">
        <div className="inv-section__inner">
          <h2 className="inv-manifest-dress__title">{title}</h2>
          {art ? (
            <div className="inv-manifest-dress__art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art} alt="" />
            </div>
          ) : null}
          <p className="inv-manifest-dress__note">{note}</p>
        </div>
      </FramedInner>
    </section>
  );
}

export { FramedInner };
