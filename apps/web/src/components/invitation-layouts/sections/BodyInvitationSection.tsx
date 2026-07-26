'use client';

import { interpolateFieldTemplate } from '@/lib/templates/manifest-fields';
import { boundField, type SectionProps } from './types';
import { FramedInner } from './DressCodeSection';
import { EditableField } from '../EditableField';

function Divider({ ctx, variant }: { ctx: SectionProps['ctx']; variant?: string }) {
  const key = variant === 'card' ? 'dividerCard' : 'divider';
  const src = ctx.assetUrl(key);
  if (!src) {
    return (
      <div className="inv-divider-fallback" aria-hidden>
        <span className="inv-divider-fallback__line" />
        <span className="inv-divider-fallback__dot" />
        <span className="inv-divider-fallback__line" />
      </div>
    );
  }
  return (
    <div className="inv-divider-asset">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
    </div>
  );
}

export function BodyInvitationSection({ ctx, bindings, sectionProps }: SectionProps) {
  const isKz = ctx.invitation.language === 'kz';
  const rawBody = isKz
    ? boundField(bindings, 'bodyText', ctx.fields)
    : boundField(bindings, 'bodyTextRu', ctx.fields);
  const body = interpolateFieldTemplate(rawBody, ctx.fields);
  const hostsLine = boundField(bindings, 'hostsLine', ctx.fields);
  const frameKey = typeof sectionProps?.frame === 'string' ? sectionProps.frame : undefined;
  const bodyField = isKz
    ? (bindings?.bodyText ?? 'bodyTextKz')
    : (bindings?.bodyTextRu ?? 'bodyTextRu');
  const hostsField = bindings?.hostsLine ?? 'hostsLine';

  const renderHosts = () => {
    if (ctx.isEditing && ctx.onFieldSave) {
      return (
        <EditableField
          value={hostsLine}
          field={`customText.${hostsField}`}
          onSave={ctx.onFieldSave}
          as="p"
          className="inv-manifest-body__hosts"
        />
      );
    }
    return <p className="inv-manifest-body__hosts">{hostsLine}</p>;
  };

  return (
    <section className="inv-section inv-manifest-body" data-section="body-invitation">
      <FramedInner ctx={ctx} frameKey={frameKey} className="inv-framed--greeting">
        <div className="inv-section__inner">
          <Divider ctx={ctx} />
          <div
            className="inv-body inv-manifest-body__text"
            data-edit-field={`customText.${bodyField}`}
          >
            {ctx.isEditing && ctx.onFieldSave ? (
              <EditableField
                value={rawBody}
                field={`customText.${bodyField}`}
                onSave={ctx.onFieldSave}
                as="p"
                className="inv-manifest-body__editable"
              />
            ) : (
              body.split('\n').map((line, i) => (
                <p key={i}>{line.trim() ? line : '\u00a0'}</p>
              ))
            )}
          </div>
          <Divider ctx={ctx} variant="card" />
          {renderHosts()}
          <p className="inv-manifest-body__couple">
            {[ctx.fields.groomName, ctx.fields.brideName].filter(Boolean).join(' & ')}
          </p>
        </div>
      </FramedInner>
    </section>
  );
}
