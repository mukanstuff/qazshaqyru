import type { GiftBlockElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function GiftSection({
  el,
  onUpdate,
  t,
}: {
  el: GiftBlockElement;
  onUpdate: (p: Partial<GiftBlockElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.gift}>
      <Field label={t.title}>
        <input
          type="text"
          value={el.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.subtitle || t.title}>
        <input
          type="text"
          value={el.subtitle || ''}
          onChange={(e) => onUpdate({ subtitle: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.kaspiPhone}>
        <input
          type="text"
          value={el.kaspiPhone || ''}
          onChange={(e) => onUpdate({ kaspiPhone: e.target.value || undefined })}
          className={inputCls}
          placeholder="+7 700 000 0000"
        />
      </Field>
      <Field label={t.kaspiCard}>
        <input
          type="text"
          value={el.kaspiCard || ''}
          onChange={(e) => onUpdate({ kaspiCard: e.target.value || undefined })}
          className={inputCls}
          placeholder="4400 4301 …"
        />
      </Field>
      <Field label={t.color + ' (акцент)'}>
        <SwatchColorPicker value={el.accentColor} onChange={(c) => onUpdate({ accentColor: c })} />
      </Field>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.showDonors}
          onChange={(e) => onUpdate({ showDonors: e.target.checked })}
        />
        {t.showDonors}
      </label>
    </Section>
  );
}
