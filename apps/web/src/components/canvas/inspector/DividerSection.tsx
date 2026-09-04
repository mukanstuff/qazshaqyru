import type { DividerElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function DividerSection({
  el,
  onUpdate,
  t,
}: {
  el: DividerElement;
  onUpdate: (p: Partial<DividerElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.divider}>
      <Field label={t.color}>
        <SwatchColorPicker value={el.color} onChange={(c) => onUpdate({ color: c } as Partial<DividerElement>)} />
      </Field>
      <Field label={t.thickness}>
        <input
          type="number"
          min={1}
          max={20}
          value={el.thickness}
          onChange={(e) => onUpdate({ thickness: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <Field label={t.lineStyle}>
        <select
          value={el.style}
          onChange={(e) => onUpdate({ style: e.target.value as DividerElement['style'] })}
          className={inputCls}
        >
          <option value="solid">solid</option>
          <option value="dashed">dashed</option>
          <option value="dotted">dotted</option>
          <option value="ornament">ornament</option>
        </select>
      </Field>
    </Section>
  );
}
