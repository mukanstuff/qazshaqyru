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
      {/* The image link is gone. `linkHref` was written here and read nowhere:
          no renderer wrapped the picture in an anchor, so a host could type a
          URL, save it, and the guest page would ignore it for ever. A picture
          that has to lead somewhere is a `button` element, which works. */}
    </Section>
  );
}
