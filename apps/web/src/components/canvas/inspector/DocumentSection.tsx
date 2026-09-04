import type { FontFamily, InvitationCanvasDocument } from '@/lib/canvas/types';
import { SwatchColorPicker } from '../SwatchColorPicker';
import { Field, FontSelect, Section, inputCls, type InspectorT } from './shared';

// --- Stage 1: Document-level controls (toi.com.kz long scroll) ---
export function DocumentSection({
  doc,
  onChange,
  t,
  locale,
}: {
  doc: InvitationCanvasDocument;
  onChange: (patch: Partial<InvitationCanvasDocument>) => void;
  t: InspectorT;
  locale: 'ru' | 'kz';
}) {
  const bg = doc.background || { type: 'solid', color: '#ffffff' };
  const setBg = (patch: Partial<typeof bg>) =>
    onChange({ background: { ...bg, ...patch } as typeof bg });
  const docAny = doc as InvitationCanvasDocument & {
    defaultFontFamily?: FontFamily;
    autoplay?: boolean;
    slug?: string;
    defaultLocation?: string;
    defaultWhatsapp?: string;
    rsvpAskPlusOne?: boolean;
    rsvpAskDietary?: boolean;
    rsvpAskChildren?: boolean;
    ogTitle?: string;
    ogImageSrc?: string;
  };

  return (
    <>
      <Section title="Фон">
        <Field label={t.bgColor}>
          <SwatchColorPicker value={bg.color || '#ffffff'} onChange={(c) => setBg({ color: c })} />
        </Field>
        <Field label={t.accentColor}>
          <SwatchColorPicker
            value={(bg as { accentColor?: string }).accentColor || '#c9a961'}
            onChange={(c) => onChange({ background: { ...bg, accentColor: c } as typeof bg })}
          />
        </Field>
      </Section>

      <Section title={locale === 'ru' ? 'Шрифт и автопрокрутка' : 'Қаріп және автопрокрутка'}>
        <Field label={t.docFont}>
          <FontSelect
            value={(docAny.defaultFontFamily || 'Montserrat') as FontFamily}
            onChange={(v) => onChange({ defaultFontFamily: v } as Partial<InvitationCanvasDocument>)}
          />
        </Field>
        <label className="ci-checkbox">
          <input
            type="checkbox"
            checked={!!docAny.autoplay}
            onChange={(e) => onChange({ autoplay: e.target.checked } as Partial<InvitationCanvasDocument>)}
          />
          {t.autoplay}
        </label>
      </Section>

      <Section title={locale === 'ru' ? 'Локация и ссылка' : 'Орналасқан жері және сілтеме'}>
        <Field label={t.slug}>
          <input
            type="text"
            value={docAny.slug || ''}
            onChange={(e) =>
              onChange({ slug: e.target.value || undefined } as Partial<InvitationCanvasDocument>)
            }
            className={inputCls}
            placeholder="aibek-aidana-2026"
          />
        </Field>
        <Field label={t.location}>
          <input
            type="text"
            value={docAny.defaultLocation || ''}
            onChange={(e) =>
              onChange({
                defaultLocation: e.target.value || undefined,
              } as Partial<InvitationCanvasDocument>)
            }
            className={inputCls}
            placeholder="Алматы, Ресторан Жетысу"
          />
        </Field>
        <Field label={t.whatsapp}>
          <input
            type="text"
            value={docAny.defaultWhatsapp || ''}
            onChange={(e) =>
              onChange({
                defaultWhatsapp: e.target.value || undefined,
              } as Partial<InvitationCanvasDocument>)
            }
            className={inputCls}
            placeholder="+7 700 000 0000"
          />
        </Field>
      </Section>

      <Section title={t.rsvpFields}>
        <label className="ci-checkbox">
          <input
            type="checkbox"
            checked={!!docAny.rsvpAskPlusOne}
            onChange={(e) =>
              onChange({ rsvpAskPlusOne: e.target.checked } as Partial<InvitationCanvasDocument>)
            }
          />
          +1 (с кем)
        </label>
        <label className="ci-checkbox">
          <input
            type="checkbox"
            checked={!!docAny.rsvpAskDietary}
            onChange={(e) =>
              onChange({ rsvpAskDietary: e.target.checked } as Partial<InvitationCanvasDocument>)
            }
          />
          Диета / аллергии
        </label>
        <label className="ci-checkbox">
          <input
            type="checkbox"
            checked={!!docAny.rsvpAskChildren}
            onChange={(e) =>
              onChange({ rsvpAskChildren: e.target.checked } as Partial<InvitationCanvasDocument>)
            }
          />
          Дети
        </label>
      </Section>

      <Section title={t.ogCard}>
        <Field label={t.title}>
          <input
            type="text"
            value={docAny.ogTitle || ''}
            onChange={(e) =>
              onChange({ ogTitle: e.target.value || undefined } as Partial<InvitationCanvasDocument>)
            }
            className={inputCls}
          />
        </Field>
        <Field label="OG image URL">
          <input
            type="text"
            value={docAny.ogImageSrc || ''}
            onChange={(e) =>
              onChange({ ogImageSrc: e.target.value || undefined } as Partial<InvitationCanvasDocument>)
            }
            className={inputCls}
            placeholder="https://…"
          />
        </Field>
      </Section>

      <Section title={locale === 'ru' ? 'Ширина холста' : 'Холст ені'}>
        <Field label="px">
          <input
            type="number"
            value={doc.width}
            min={320}
            max={1600}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
      </Section>
    </>
  );
}
