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
      <Field label={t.colorAccent}>
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
      {/* The playlist editor is gone. It parsed `Название|ссылка` lines into a
          `trackList` and saved them, and the player reads `audioSrc` and
          nothing else — there is no next-track control anywhere in the
          product. A host could type out a whole programme of music and the
          page would play none of it. One track is what the player supports,
          and the field above is where it goes. */}
    </Section>
  );
}
