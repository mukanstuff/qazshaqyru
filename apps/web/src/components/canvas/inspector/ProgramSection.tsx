import { Plus, X } from 'lucide-react';
import type { ProgramElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, FontSelect, Section, inputCls, type InspectorT } from './shared';

export function ProgramSection({
  el,
  onUpdate,
  t,
}: {
  el: ProgramElement;
  onUpdate: (p: Partial<ProgramElement>) => void;
  t: InspectorT;
}) {
  const updateItem = (idx: number, patch: Partial<{ time: string; title: string; description?: string }>) => {
    const items = el.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onUpdate({ items });
  };
  const removeItem = (idx: number) => {
    onUpdate({ items: el.items.filter((_, i) => i !== idx) });
  };
  const addItem = () => {
    onUpdate({
      items: [...el.items, { id: Math.random().toString(36).slice(2, 8), time: '', title: '' }],
    });
  };
  return (
    <Section title={t.program}>
      {/* The look is the template's, but it is a real choice for the host too:
          the same items draw as a list, a rail, a centred stack or a zigzag. */}
      <Field label={t.programLook}>
        <select
          value={el.variant ?? 'list'}
          onChange={(e) => onUpdate({ variant: e.target.value as ProgramElement['variant'] })}
          className={inputCls}
        >
          <option value="stack">{t.programStack}</option>
          <option value="zigzag">{t.programZigzag}</option>
          <option value="rail">{t.programRail}</option>
          <option value="list">{t.programList}</option>
        </select>
      </Field>
      <Field label={t.title}>
        <input
          type="text"
          value={el.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {el.items.map((it, idx) => (
          <div key={it.id} style={{ borderRadius: 'var(--ed-radius-sm)', border: '1px solid var(--ed-border)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="text"
              value={it.time}
              placeholder="16:00"
              onChange={(e) => updateItem(idx, { time: e.target.value })}
              className={inputCls + ' is-block'}
            />
            <input
              type="text"
              value={it.title}
              placeholder={t.title}
              onChange={(e) => updateItem(idx, { title: e.target.value })}
              className={inputCls + ' is-block'}
            />
            <button
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}
              onClick={() => removeItem(idx)}
            >
              <X size={12} aria-hidden="true" /> {t.delete}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="canvas-btn is-block"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          onClick={addItem}
        >
          <Plus size={14} aria-hidden="true" /> {t.addItem}
        </button>
      </div>
      <Field label={t.font}>
        <FontSelect value={el.fontFamily} onChange={(v) => onUpdate({ fontFamily: v })} />
      </Field>
      {el.variant && el.variant !== 'list' ? (
        <Field label={t.timeFont}>
          <FontSelect value={el.timeFontFamily ?? el.fontFamily} onChange={(v) => onUpdate({ timeFontFamily: v })} />
        </Field>
      ) : null}
      <Field label={t.bgColor}>
        <SwatchColorPicker value={el.bgColor} onChange={(c) => onUpdate({ bgColor: c })} />
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.textColor} onChange={(c) => onUpdate({ textColor: c })} />
      </Field>
      <Field label={t.accentColor}>
        <SwatchColorPicker value={el.accentColor} onChange={(c) => onUpdate({ accentColor: c })} />
      </Field>
    </Section>
  );
}
