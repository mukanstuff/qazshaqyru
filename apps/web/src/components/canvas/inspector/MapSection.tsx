import type { MapElement } from '@/lib/canvas/types';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function MapSection({
  el,
  onUpdate,
  t,
}: {
  el: MapElement;
  onUpdate: (p: Partial<MapElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.map}>
      <Field label={t.address}>
        <input
          type="text"
          value={el.address || ''}
          onChange={(e) => onUpdate({ address: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      {/* Latitude, longitude and zoom are gone. The map view builds everything
          from the address field — it parses the 2GIS or Maps link the host
          pastes there and embeds it — and never read a coordinate or a zoom
          level. Three numeric fields that changed nothing on the page, on a
          screen where the host is already hunting for the one that does. */}
      <Field label={t.buttonLabel}>
        <input
          type="text"
          value={el.buttonLabel || ''}
          onChange={(e) => onUpdate({ buttonLabel: e.target.value || undefined })}
          className={inputCls}
          placeholder={t.openMapPlaceholder}
        />
      </Field>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.showStaticOnly}
          onChange={(e) => onUpdate({ showStaticOnly: e.target.checked })}
        />
        {t.staticMapOnly}
      </label>
    </Section>
  );
}
