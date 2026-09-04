import type { CountdownElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, FontSelect, Section, inputCls, type InspectorT } from './shared';

export function CountdownSection({
  el,
  onUpdate,
  t,
}: {
  el: CountdownElement;
  onUpdate: (p: Partial<CountdownElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.countdown}>
      <Field label={t.targetDate}>
        <input
          type="datetime-local"
          value={el.targetIso ? el.targetIso.slice(0, 16) : ''}
          onChange={(e) => onUpdate({ targetIso: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.timezone}>
        <select
          value={el.timezone || 'Asia/Almaty'}
          onChange={(e) => onUpdate({ timezone: e.target.value })}
          className={inputCls}
        >
          <option value="Asia/Almaty">Asia/Almaty</option>
          <option value="Asia/Astana">Asia/Astana</option>
          <option value="Europe/Moscow">Europe/Moscow</option>
          <option value="UTC">UTC</option>
        </select>
      </Field>
      <Field label={t.font}>
        <FontSelect value={el.fontFamily} onChange={(v) => onUpdate({ fontFamily: v })} />
      </Field>
      <Field label={t.size}>
        <input
          type="number"
          value={el.fontSize}
          min={12}
          max={96}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.color} onChange={(c) => onUpdate({ color: c })} />
      </Field>
      <Field label={t.color + ' (акцент)'}>
        <SwatchColorPicker value={el.accentColor || '#c9a961'} onChange={(c) => onUpdate({ accentColor: c })} />
      </Field>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.showLabels}
          onChange={(e) => onUpdate({ showLabels: e.target.checked })}
        />
        {t.showLabels}
      </label>
    </Section>
  );
}
