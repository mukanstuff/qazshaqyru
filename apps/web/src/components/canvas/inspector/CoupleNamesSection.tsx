import type { CoupleNamesElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, FontSelect, Section, inputCls, type InspectorT } from './shared';

export function CoupleNamesSection({
  el,
  onUpdate,
  t,
}: {
  el: CoupleNamesElement;
  onUpdate: (p: Partial<CoupleNamesElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.coupleNames}>
      <Field label={t.firstName}>
        <input
          type="text"
          value={el.first}
          onChange={(e) => onUpdate({ first: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label={t.secondName}>
        <input
          type="text"
          value={el.second}
          onChange={(e) => onUpdate({ second: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label={t.connector}>
        <select
          value={el.connector}
          onChange={(e) => onUpdate({ connector: e.target.value as CoupleNamesElement['connector'] })}
          className={inputCls}
        >
          <option value="&">&amp;</option>
          <option value="heart">♥</option>
          <option value="ornament">❀</option>
          <option value="және">және</option>
          <option value="и">и</option>
        </select>
      </Field>
      <Field label={t.font}>
        <FontSelect value={el.font} onChange={(v) => onUpdate({ font: v })} />
      </Field>
      <Field label={t.size}>
        <input
          type="number"
          value={el.fontSize}
          min={12}
          max={120}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.color} onChange={(c) => onUpdate({ color: c })} />
      </Field>
      <Field label={t.color + ' (коннектор)'}>
        <SwatchColorPicker value={el.connectorColor || '#c9a961'} onChange={(c) => onUpdate({ connectorColor: c })} />
      </Field>
    </Section>
  );
}
