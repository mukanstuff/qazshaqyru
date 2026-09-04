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
      <Field label={t.lat}>
        <input
          type="number"
          step="0.0001"
          value={el.lat ?? ''}
          onChange={(e) => onUpdate({ lat: e.target.value ? Number(e.target.value) : undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.lng}>
        <input
          type="number"
          step="0.0001"
          value={el.lng ?? ''}
          onChange={(e) => onUpdate({ lng: e.target.value ? Number(e.target.value) : undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.zoom}>
        <input
          type="number"
          min={1}
          max={20}
          value={el.zoom ?? 14}
          onChange={(e) => onUpdate({ zoom: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
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
