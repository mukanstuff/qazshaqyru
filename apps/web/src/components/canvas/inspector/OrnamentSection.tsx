import type { OrnamentElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function OrnamentSection({
  el,
  onUpdate,
  t,
}: {
  el: OrnamentElement;
  onUpdate: (p: Partial<OrnamentElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.ornament}>
      <Field label={t.ornamentId}>
        <select
          value={el.ornamentId}
          onChange={(e) => onUpdate({ ornamentId: e.target.value })}
          className={inputCls}
        >
          <option value="oy-1">Ою-өрнек 1</option>
          <option value="oy-2">Ою-өрнек 2</option>
          <option value="oy-3">Ою-өрнек 3</option>
          <option value="oy-4">Ою-өрнек 4</option>
        </select>
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.color || '#c9a961'} onChange={(c) => onUpdate({ color: c })} />
      </Field>
      <Field label={t.customUrl}>
        <input
          type="text"
          value={el.src || ''}
          onChange={(e) => onUpdate({ src: e.target.value || undefined })}
          className={inputCls}
          placeholder="https://…svg"
        />
      </Field>
      <label className="ci-checkbox">
        <input type="checkbox" checked={!!el.flipX} onChange={(e) => onUpdate({ flipX: e.target.checked })} />
        {t.flipX}
      </label>
      <label className="ci-checkbox">
        <input type="checkbox" checked={!!el.flipY} onChange={(e) => onUpdate({ flipY: e.target.checked })} />
        {t.flipY}
      </label>
    </Section>
  );
}
