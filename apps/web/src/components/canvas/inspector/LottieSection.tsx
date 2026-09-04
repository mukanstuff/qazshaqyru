import type { LottieElement } from '@/lib/canvas/types';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function LottieSection({
  el,
  onUpdate,
  t,
}: {
  el: LottieElement;
  onUpdate: (p: Partial<LottieElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.lottie}>
      <Field label={t.lottieSrc}>
        <input
          type="text"
          value={el.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          className={inputCls}
          placeholder="https://…lottie.json"
        />
      </Field>
      <Field label={t.speed}>
        <input
          type="number"
          step="0.1"
          min={0.1}
          max={3}
          value={el.speed}
          onChange={(e) => onUpdate({ speed: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <label className="ci-checkbox">
        <input type="checkbox" checked={!!el.loop} onChange={(e) => onUpdate({ loop: e.target.checked })} />
        {t.loop}
      </label>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.autoplay}
          onChange={(e) => onUpdate({ autoplay: e.target.checked })}
        />
        {t.autoplayLottie}
      </label>
    </Section>
  );
}
