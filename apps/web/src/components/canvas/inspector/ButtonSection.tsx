import type { ButtonElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, Section, inputCls, numCls, type InspectorT } from './shared';

export function ButtonSection({ el, onUpdate, t }: { el: ButtonElement; onUpdate: (p: Partial<ButtonElement>) => void; t: InspectorT }) {
  return (
    <Section title={t.text}>
      <Field label={t.content}>
        <input
          type="text"
          value={el.label}
          onChange={(e) => onUpdate({ label: e.target.value } as Partial<ButtonElement>)}
          className={inputCls}
        />
      </Field>
      <Field label={t.bgColor}>
        <SwatchColorPicker value={el.bgColor} onChange={(c) => onUpdate({ bgColor: c } as Partial<ButtonElement>)} />
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.textColor} onChange={(c) => onUpdate({ textColor: c } as Partial<ButtonElement>)} />
      </Field>
      <Field label={t.borderRadius}>
        <input
          type="number"
          value={el.borderRadius}
          onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) } as Partial<ButtonElement>)}
          className={numCls}
        />
      </Field>
    </Section>
  );
}
