import type { MusicPlayerElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function MusicSection({
  el,
  onUpdate,
  t,
}: {
  el: MusicPlayerElement;
  onUpdate: (p: Partial<MusicPlayerElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.music}>
      <Field label={t.title}>
        <input
          type="text"
          value={el.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.audioSrc}>
        <input
          type="text"
          value={el.audioSrc || ''}
          onChange={(e) => onUpdate({ audioSrc: e.target.value || undefined })}
          className={inputCls}
          placeholder="https://… или загрузить свою"
        />
      </Field>
      <Field label={t.color + ' (акцент)'}>
        <SwatchColorPicker value={el.accentColor} onChange={(c) => onUpdate({ accentColor: c })} />
      </Field>
      <label className="ci-checkbox">
        <input
          type="checkbox"
          checked={!!el.autoPlayMuted}
          onChange={(e) => onUpdate({ autoPlayMuted: e.target.checked })}
        />
        {t.musicAutoplay}
      </label>
      <div className="ci-section" style={{ marginTop: '8px' }}>
        <span className="ci-row-label" style={{ display: 'block', marginBottom: '6px' }}>{t.trackList}</span>
        <textarea
          rows={3}
          value={(el.trackList || []).map((tr) => `${tr.title}|${tr.src}`).join('\n')}
          onChange={(e) => {
            const lines = e.target.value.split('\n').filter(Boolean);
            const trackList = lines.map((line, i) => {
              const [title, src] = line.split('|');
              return { id: `${i}-${(src || '').slice(0, 6)}`, title: title || '', src: src || '' };
            });
            onUpdate({ trackList });
          }}
          className="canvas-inspector-textarea is-block"
          placeholder={'Трек 1|https://…\nТрек 2|https://…'}
          style={{ height: '80px' }}
        />
      </div>
    </Section>
  );
}
