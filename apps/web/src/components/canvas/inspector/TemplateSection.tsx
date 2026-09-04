import type { CanvasElement } from '@/lib/canvas/types';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function TemplateSection({ el, onUpdate, t }: { el: CanvasElement; onUpdate: (p: Partial<CanvasElement>) => void; t: InspectorT }) {
  return (
    <Section title={t.template}>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.editableByEndUser}
          onChange={(e) => onUpdate({ editableByEndUser: e.target.checked })}
        />
        <span className="ci-checkbox-label">{t.editable}</span>
      </label>
      <Field label={t.bind}>
        <select
          value={el.placeholderKey || ''}
          onChange={(e) => onUpdate({ placeholderKey: (e.target.value || undefined) as CanvasElement['placeholderKey'] })}
          className={inputCls + ' canvas-inspector-select'}
        >
          <option value="">—</option>
          <option value="groomName">groomName</option>
          <option value="brideName">brideName</option>
          <option value="coupleNames">coupleNames</option>
          <option value="eventDate">eventDate</option>
          <option value="eventTime">eventTime</option>
          <option value="venueName">venueName</option>
          <option value="venueAddress">venueAddress</option>
          <option value="coverPhoto">coverPhoto</option>
          <option value="couplePhoto">couplePhoto</option>
          <option value="hashtag">hashtag</option>
          <option value="dressCode">dressCode</option>
        </select>
      </Field>
    </Section>
  );
}
