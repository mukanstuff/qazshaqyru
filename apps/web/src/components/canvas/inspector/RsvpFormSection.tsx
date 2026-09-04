import type { RsvpFormElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, FontSelect, Section, inputCls, type InspectorT } from './shared';

export function RsvpFormSection({
  el,
  onUpdate,
  t,
}: {
  el: RsvpFormElement;
  onUpdate: (p: Partial<RsvpFormElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.rsvp}>
      <Field label={t.title}>
        <input
          type="text"
          value={el.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.font}>
        <FontSelect value={el.fontFamily} onChange={(v) => onUpdate({ fontFamily: v })} />
      </Field>
      <Field label={t.bgColor}>
        <SwatchColorPicker value={el.bgColor} onChange={(c) => onUpdate({ bgColor: c })} />
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.textColor} onChange={(c) => onUpdate({ textColor: c })} />
      </Field>
      <Field label={t.color + ' (акцент)'}>
        <SwatchColorPicker value={el.accentColor} onChange={(c) => onUpdate({ accentColor: c })} />
      </Field>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.askPlusOne}
          onChange={(e) => onUpdate({ askPlusOne: e.target.checked })}
        />
        {t.askPlusOne}
      </label>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.askDietary}
          onChange={(e) => onUpdate({ askDietary: e.target.checked })}
        />
        {t.askDietary}
      </label>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.askChildren}
          onChange={(e) => onUpdate({ askChildren: e.target.checked })}
        />
        {t.askChildren}
      </label>
      <Field label={t.whatsappRsvp}>
        <input
          type="tel"
          value={el.whatsappPhone || ''}
          placeholder="+7 700 000 00 00"
          onChange={(e) => onUpdate({ whatsappPhone: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <p className="ci-hint">{t.whatsappRsvpHint}</p>
    </Section>
  );
}
