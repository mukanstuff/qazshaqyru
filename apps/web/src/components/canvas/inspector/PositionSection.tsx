import type { CanvasElement } from '@/lib/canvas/types';
import { Field, Section, inputCls, numCls, type InspectorT } from './shared';

export function PositionSection({ el, onUpdate, t }: { el: CanvasElement; onUpdate: (p: Partial<CanvasElement>) => void; t: InspectorT }) {
  return (
    <Section title={t.position}>
      <div className="ci-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        <Field label={t.x}>
          <input
            type="number"
            value={Math.round(el.x * 10) / 10}
            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
            className={numCls}
          />
        </Field>
        <Field label={t.y}>
          <input
            type="number"
            value={Math.round(el.y)}
            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
            className={numCls}
          />
        </Field>
        <Field label={t.w}>
          <input
            type="number"
            value={Math.round(el.w * 10) / 10}
            onChange={(e) => onUpdate({ w: Number(e.target.value) })}
            className={numCls}
          />
        </Field>
        <Field label={t.h}>
          <input
            type="text"
            value={typeof el.h === 'number' ? Math.round(el.h) : 'auto'}
            onChange={(e) => {
              const v = e.target.value;
              onUpdate({ h: v === 'auto' ? 'auto' : Number(v) });
            }}
            className={inputCls}
          />
        </Field>
        <Field label={t.rot}>
          <input
            type="number"
            value={el.rotation}
            onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
            className={numCls}
          />
        </Field>
      </div>
    </Section>
  );
}
