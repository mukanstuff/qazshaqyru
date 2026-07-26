'use client';

import { MapPin } from 'lucide-react';
import { useI18n } from '@/i18n';
import { boundField, type SectionProps } from './types';
import { FramedInner } from './DressCodeSection';
import { EditableField } from '../EditableField';

export function VenueMapSection({ ctx, bindings, sectionProps }: SectionProps) {
  const { t } = useI18n();
  const venueName = boundField(bindings, 'venueName', ctx.fields);
  const venueAddress = boundField(bindings, 'venueAddress', ctx.fields);
  const mapUrl = boundField(bindings, 'mapUrl', ctx.fields);
  const isKz = ctx.invitation.language === 'kz';
  const frameKey = typeof sectionProps?.frame === 'string' ? sectionProps.frame : undefined;
  const dividerRose = ctx.assetUrl('dividerRose');
  const nameField = 'eventPlace';
  const addressField = 'address';

  if (!venueName && !venueAddress && !ctx.isEditing) return null;

  const renderName = () => {
    if (ctx.isEditing && ctx.onFieldSave) {
      return (
        <EditableField
          value={venueName}
          field={nameField}
          onSave={ctx.onFieldSave}
          as="h2"
          className="inv-manifest-venue__name"
        />
      );
    }
    return venueName ? <h2 className="inv-manifest-venue__name">{venueName}</h2> : null;
  };

  const renderAddress = () => {
    if (ctx.isEditing && ctx.onFieldSave) {
      return (
        <EditableField
          value={venueAddress}
          field={addressField}
          onSave={ctx.onFieldSave}
          as="p"
          className="inv-info-row__value"
        />
      );
    }
    return <p className="inv-info-row__value">{venueAddress}</p>;
  };

  return (
    <section className="inv-section inv-manifest-venue" data-section="venue-map">
      <FramedInner ctx={ctx} frameKey={frameKey} className="inv-framed--date">
        <div className="inv-section__inner">
          <p className="inv-label">{isKz ? 'Мекен-жайы:' : 'Место проведения'}</p>
          {renderName()}
          {dividerRose ? (
            <div className="inv-manifest-venue__divider">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dividerRose} alt="" />
            </div>
          ) : null}
          {venueAddress || ctx.isEditing ? (
            <div className="inv-info-row inv-manifest-venue__address">
              <span className="inv-info-row__icon" aria-hidden>
                <MapPin size={16} />
              </span>
              <div>
                <p className="inv-info-row__label">{t('public.details.address')}</p>
                {renderAddress()}
              </div>
            </div>
          ) : null}
          {mapUrl ? (
            <div className="inv-map-link inv-manifest-venue__map">
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inv-manifest-map-btn"
              >
                {isKz ? 'Картаны ашу' : t('public.details.openOnMap')}
              </a>
            </div>
          ) : null}
        </div>
      </FramedInner>
    </section>
  );
}
