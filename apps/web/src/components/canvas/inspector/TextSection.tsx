import type { TextElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, FontSelect, Section, inputCls, numCls, type InspectorT } from './shared';

export function TextSection({ el, onUpdate, t }: { el: TextElement; onUpdate: (p: Partial<TextElement>) => void; t: InspectorT }) {
  return (
    <>
      <Section title={t.text}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ed-text-muted)', display: 'block', marginBottom: '4px' }}>{t.content}</span>
          <textarea
            value={el.text}
            rows={3}
            onChange={(e) => onUpdate({ text: e.target.value } as Partial<TextElement>)}
            className="canvas-inspector-textarea is-block"
            style={{ height: '80px' }}
          />
        </label>
        <Field label={t.font}>
          <FontSelect value={el.fontFamily} onChange={(v) => onUpdate({ fontFamily: v } as Partial<TextElement>)} />
        </Field>
        <Field label={t.size}>
          <input
            type="number"
            value={el.fontSize}
            min={6}
            max={200}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) } as Partial<TextElement>)}
            className={numCls}
          />
        </Field>
        <Field label={t.weight}>
          <select
            value={el.fontWeight}
            onChange={(e) => onUpdate({ fontWeight: Number(e.target.value) as TextElement['fontWeight'] } as Partial<TextElement>)}
            className={inputCls + ' canvas-inspector-select'}
          >
            {[300, 400, 500, 600, 700, 800].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </Field>
        <Field label={t.color}>
          <SwatchColorPicker value={el.color} onChange={(c) => onUpdate({ color: c } as Partial<TextElement>)} />
        </Field>
        <Field label={t.align}>
          <select
            value={el.textAlign}
            onChange={(e) => onUpdate({ textAlign: e.target.value as TextElement['textAlign'] } as Partial<TextElement>)}
            className={inputCls + ' canvas-inspector-select'}
          >
            <option value="left">←</option>
            <option value="center">↔</option>
            <option value="right">→</option>
          </select>
        </Field>
        <Field label={t.lineH}>
          <input
            type="number"
            step="0.1"
            min={0.5}
            max={5}
            value={el.lineHeight}
            onChange={(e) => onUpdate({ lineHeight: Number(e.target.value) } as Partial<TextElement>)}
            className={numCls}
          />
        </Field>
        <label className="ci-checkbox">
          <input
            type="checkbox"
            checked={!!el.italic}
            onChange={(e) => onUpdate({ italic: e.target.checked } as Partial<TextElement>)}
          />
          <span className="ci-checkbox-label">{t.italic}</span>
        </label>
        <label className="ci-checkbox">
          <input
            type="checkbox"
            checked={!!el.uppercase}
            onChange={(e) => onUpdate({ uppercase: e.target.checked } as Partial<TextElement>)}
          />
          <span className="ci-checkbox-label">{t.upper}</span>
        </label>
      </Section>
    </>
  );
}
