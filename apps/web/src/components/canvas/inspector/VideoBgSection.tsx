import type { VideoBgElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function VideoBgSection({
  el,
  onUpdate,
  t,
}: {
  el: VideoBgElement;
  onUpdate: (p: Partial<VideoBgElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.videoBg}>
      <Field label={t.videoSrc}>
        <input
          type="text"
          value={el.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          className={inputCls}
          placeholder="https://…mp4"
        />
      </Field>
      <Field label={t.posterSrc}>
        <input
          type="text"
          value={el.posterSrc || ''}
          onChange={(e) => onUpdate({ posterSrc: e.target.value || undefined })}
          className={inputCls}
          placeholder="https://…jpg"
        />
      </Field>
      <Field label={t.colorOverlay}>
        <SwatchColorPicker value={el.overlayColor || '#000000'} onChange={(c) => onUpdate({ overlayColor: c })} />
      </Field>
      <Field label={t.opacity}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={el.opacity ?? 1}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
          className="ci-range"
        />
      </Field>
    </Section>
  );
}
