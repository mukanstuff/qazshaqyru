import { ArrowDownToLine, ArrowUpToLine, Copy, Trash2 } from 'lucide-react';
import type { CanvasElement } from '@/lib/canvas/types';
import { Section, type InspectorT } from './shared';

export function CommonActions({
  onDelete,
  onDuplicate,
  onLayer,
  t,
  el,
  onUpdate,
}: {
  onDelete: () => void;
  onDuplicate: () => void;
  onLayer: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  t: InspectorT;
  el: CanvasElement;
  onUpdate: (p: Partial<CanvasElement>) => void;
}) {
  return (
    <Section title={t.view}>
      <div className="ci-action-grid">
        <button className="ci-action-btn" onClick={() => onLayer('front')}>
          <ArrowUpToLine size={14} aria-hidden="true" /> {t.front}
        </button>
        <button className="ci-action-btn" onClick={() => onLayer('back')}>
          <ArrowDownToLine size={14} aria-hidden="true" /> {t.back}
        </button>
        <button className="ci-action-btn" onClick={onDuplicate}>
          <Copy size={14} aria-hidden="true" /> {t.duplicate}
        </button>
        <button className="ci-action-btn is-danger" onClick={onDelete}>
          <Trash2 size={14} aria-hidden="true" /> {t.delete}
        </button>
      </div>
      <label className="ci-checkbox">
        <input type="checkbox" checked={!!el.locked} onChange={(e) => onUpdate({ locked: e.target.checked })} />
        <span className="ci-checkbox-label">{t.lock}</span>
      </label>
      <label className="ci-checkbox">
        <input type="checkbox" checked={!!el.hidden} onChange={(e) => onUpdate({ hidden: e.target.checked })} />
        <span className="ci-checkbox-label">{t.hide}</span>
      </label>
    </Section>
  );
}
