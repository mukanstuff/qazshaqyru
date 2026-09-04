import type { WishesElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, FontSelect, Section, inputCls, type InspectorT } from './shared';

export function WishesSection({
  el,
  onUpdate,
  t,
}: {
  el: WishesElement;
  onUpdate: (p: Partial<WishesElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.wishes}>
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
      <Field label={t.reactions}>
        <input
          type="text"
          value={el.reactions.join(' ')}
          onChange={(e) => onUpdate({ reactions: e.target.value.split(/\s+/).filter(Boolean) })}
          className={inputCls}
          placeholder="❤️ 🙏 🥂"
        />
      </Field>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.allowAnonymous}
          onChange={(e) => onUpdate({ allowAnonymous: e.target.checked })}
        />
        {t.allowAnonymous}
      </label>
    </Section>
  );
}
