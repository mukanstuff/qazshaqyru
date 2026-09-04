import type { QrCodeElement } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, Section, inputCls, type InspectorT } from './shared';

export function QrSection({
  el,
  onUpdate,
  t,
}: {
  el: QrCodeElement;
  onUpdate: (p: Partial<QrCodeElement>) => void;
  t: InspectorT;
}) {
  return (
    <Section title={t.qr}>
      <Field label={t.qrValue}>
        <input
          type="text"
          value={el.value || ''}
          onChange={(e) => onUpdate({ value: e.target.value || undefined })}
          className={inputCls}
          placeholder={t.urlOrText}
        />
      </Field>
      <Field label={t.qrSize}>
        <input
          type="number"
          min={40}
          max={400}
          value={el.size}
          onChange={(e) => onUpdate({ size: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <Field label={t.qrFg}>
        <SwatchColorPicker value={el.fgColor} onChange={(c) => onUpdate({ fgColor: c })} />
      </Field>
      <Field label={t.qrBg}>
        <SwatchColorPicker value={el.bgColor} onChange={(c) => onUpdate({ bgColor: c })} />
      </Field>
      <Field label={t.errorCorrection}>
        <select
          value={el.errorCorrection}
          onChange={(e) => onUpdate({ errorCorrection: e.target.value as QrCodeElement['errorCorrection'] })}
          className={inputCls}
        >
          <option value="L">L (7%)</option>
          <option value="M">M (15%)</option>
          <option value="Q">Q (25%)</option>
          <option value="H">H (30%)</option>
        </select>
      </Field>
      <Field label={t.title}>
        <input
          type="text"
          value={el.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
    </Section>
  );
}
