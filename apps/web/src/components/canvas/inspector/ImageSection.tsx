import type { ImageElement } from '@/lib/canvas/types';
import { Field, Section, inputCls, numCls, type InspectorT } from './shared';

export function ImageSection({ el, onUpdate, t }: { el: ImageElement; onUpdate: (p: Partial<ImageElement>) => void; t: InspectorT }) {
  return (
    <Section title={t.view}>
      <Field label={t.borderRadius}>
        <input
          type="range"
          min={0}
          max={60}
          value={el.borderRadius}
          onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) } as Partial<ImageElement>)}
          className="ci-range"
        />
      </Field>
      <Field label={t.borderRadius}>
        <input
          type="number"
          value={el.borderRadius}
          onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) } as Partial<ImageElement>)}
          className={numCls}
        />
      </Field>
      <Field label={t.link}>
        <input
          type="text"
          value={el.linkHref || ''}
          placeholder="https://…"
          onChange={(e) => onUpdate({ linkHref: e.target.value || undefined } as Partial<ImageElement>)}
          className={inputCls}
        />
      </Field>
    </Section>
  );
}
