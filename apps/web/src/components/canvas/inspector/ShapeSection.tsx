import type { ShapeElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function ShapeSection({ el, onUpdate, t }: { el: ShapeElement; onUpdate: (p: Partial<ShapeElement>) => void; t: InspectorT }) {
  return (
    <Section title={t.view}>
      <Field label={t.shapeType}>
        <select
          value={el.shape}
          onChange={(e) => onUpdate({ shape: e.target.value as ShapeElement['shape'] } as Partial<ShapeElement>)}
          className={inputCls + ' canvas-inspector-select'}
        >
          <option value="rect">{t.shapeRect}</option>
          <option value="circle">{t.shapeCircle}</option>
          <option value="line">{t.shapeLine}</option>
          <option value="star">{t.shapeStar}</option>
          <option value="arrow">{t.shapeArrow}</option>
        </select>
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.fill || '#c9a961'} onChange={(c) => onUpdate({ fill: c } as Partial<ShapeElement>)} />
      </Field>
      <Field label={t.opacity}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={el.opacity ?? 1}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) } as Partial<ShapeElement>)}
          className="ci-range"
        />
      </Field>
    </Section>
  );
}
