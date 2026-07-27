'use client';

import type { CanvasElement, TextElement, ImageElement, ButtonElement, ShapeElement } from '@/lib/canvas/types';

interface InspectorProps {
  selected: CanvasElement | null;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayer: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  locale: 'ru' | 'kz';
  mode: 'user' | 'template-builder';
}

const T = {
  ru: {
    emptyHint: 'Выберите элемент или перетащите новый с левой панели.',
    text: 'Текст',
    view: 'Вид',
    position: 'Позиция',
    animation: 'Анимация',
    template: 'Шаблон',
    font: 'Шрифт',
    size: 'Размер',
    weight: 'Насыщенность',
    color: 'Цвет',
    align: 'Выравнивание',
    lineH: 'Межстрочный',
    spacing: 'Буквенный интервал',
    italic: 'Курсив',
    upper: 'КАПС',
    content: 'Содержимое',
    delete: 'Удалить',
    duplicate: 'Дублировать',
    front: 'На передний',
    back: 'На задний',
    forward: 'Вперёд',
    backward: 'Назад',
    lock: 'Блокировать',
    hide: 'Скрыть',
    borderRadius: 'Скругление',
    opacity: 'Прозрачность',
    bgColor: 'Цвет фона',
    link: 'Ссылка',
    x: 'X',
    y: 'Y',
    w: 'Ширина',
    h: 'Высота',
    rot: 'Поворот',
    editable: 'Разрешить редактировать',
    bind: 'Привязать к полю',
  },
  kz: {
    emptyHint: 'Элементті таңдаңыз немесе сол жақтан сүйреңіз.',
    text: 'Мәтін',
    view: 'Көрініс',
    position: 'Орналасуы',
    animation: 'Анимация',
    template: 'Үлгі',
    font: 'Қаріп',
    size: 'Өлшем',
    weight: 'Қалыңдық',
    color: 'Түс',
    align: 'Туралау',
    lineH: 'Жол арасы',
    spacing: 'Әріп арасы',
    italic: 'Курсив',
    upper: 'БАС ӘРІП',
    content: 'Мазмұны',
    delete: 'Жою',
    duplicate: 'Көшірмесін жасау',
    front: 'Алдыңғы',
    back: 'Артқы',
    forward: 'Алға',
    backward: 'Артқа',
    lock: 'Бекіту',
    hide: 'Жасыру',
    borderRadius: 'Дөңгелектеу',
    opacity: 'Мөлдірлік',
    bgColor: 'Фон түсі',
    link: 'Сілтеме',
    x: 'X',
    y: 'Y',
    w: 'Ені',
    h: 'Биіктігі',
    rot: 'Бұрыш',
    editable: 'Өңдеуге рұқсат',
    bind: 'Өріске байлау',
  },
};

export function InspectorPanel(props: InspectorProps) {
  const { selected, onUpdate, onDelete, onDuplicate, onLayer, locale, mode } = props;
  const t = T[locale];

  if (!selected) {
    return (
      <aside className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-400">
        {t.emptyHint}
      </aside>
    );
  }

  const isText = selected.type === 'text' || selected.type === 'heading';
  const isImage = selected.type === 'image';
  const isButton = selected.type === 'button';
  const isShape = selected.type === 'shape';

  return (
    <aside className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-900/80 p-4 text-sm overflow-y-auto text-zinc-100 space-y-5">
      {isText && <TextSection el={selected as TextElement} onUpdate={onUpdate} t={t} />}
      {isImage && <ImageSection el={selected as ImageElement} onUpdate={onUpdate} t={t} />}
      {isButton && <ButtonSection el={selected as ButtonElement} onUpdate={onUpdate} t={t} />}
      {isShape && <ShapeSection el={selected as ShapeElement} onUpdate={onUpdate} t={t} />}

      <PositionSection el={selected} onUpdate={onUpdate} t={t} />
      <CommonActions onDelete={onDelete} onDuplicate={onDuplicate} onLayer={onLayer} t={t} el={selected} onUpdate={onUpdate} />
      {mode === 'template-builder' && <TemplateSection el={selected} onUpdate={onUpdate} t={t} />}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-xs uppercase tracking-wider text-zinc-400">{title}</h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 justify-between">
      <span className="text-zinc-300 text-xs">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-32 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:border-[#c9a961]';

function TextSection({ el, onUpdate, t }: { el: TextElement; onUpdate: (p: Partial<TextElement>) => void; t: typeof T.ru }) {
  return (
    <>
      <Section title={t.text}>
        <label className="block">
          <span className="text-xs text-zinc-300 block mb-1">{t.content}</span>
          <textarea
            value={el.text}
            rows={3}
            onChange={(e) => onUpdate({ text: e.target.value } as Partial<TextElement>)}
            className={inputCls + ' w-full h-20 resize-none'}
          />
        </label>
        <Field label={t.font}>
          <select
            value={el.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value as TextElement['fontFamily'] } as Partial<TextElement>)}
            className={inputCls}
          >
            <option value="Montserrat">Montserrat</option>
            <option value="Cormorant">Cormorant</option>
            <option value="Marck">Marck Script</option>
            <option value="Unbounded">Unbounded</option>
            <option value="system">System</option>
          </select>
        </Field>
        <Field label={t.size}>
          <input
            type="number"
            value={el.fontSize}
            min={6}
            max={200}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) } as Partial<TextElement>)}
            className={inputCls}
          />
        </Field>
        <Field label={t.weight}>
          <select
            value={el.fontWeight}
            onChange={(e) => onUpdate({ fontWeight: Number(e.target.value) as TextElement['fontWeight'] } as Partial<TextElement>)}
            className={inputCls}
          >
            {[300, 400, 500, 600, 700, 800].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </Field>
        <Field label={t.color}>
          <input
            type="color"
            value={el.color}
            onChange={(e) => onUpdate({ color: e.target.value } as Partial<TextElement>)}
            className="h-7 w-16 bg-transparent"
          />
        </Field>
        <Field label={t.align}>
          <select
            value={el.textAlign}
            onChange={(e) => onUpdate({ textAlign: e.target.value as TextElement['textAlign'] } as Partial<TextElement>)}
            className={inputCls}
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
            className={inputCls}
          />
        </Field>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!el.italic}
            onChange={(e) => onUpdate({ italic: e.target.checked } as Partial<TextElement>)}
          />
          {t.italic}
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!el.uppercase}
            onChange={(e) => onUpdate({ uppercase: e.target.checked } as Partial<TextElement>)}
          />
          {t.upper}
        </label>
      </Section>
    </>
  );
}

function ImageSection({ el, onUpdate, t }: { el: ImageElement; onUpdate: (p: Partial<ImageElement>) => void; t: typeof T.ru }) {
  return (
    <Section title={t.view}>
      <Field label={t.borderRadius}>
        <input
          type="range"
          min={0}
          max={60}
          value={el.borderRadius}
          onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) } as Partial<ImageElement>)}
        />
      </Field>
      <Field label={t.borderRadius}>
        <input
          type="number"
          value={el.borderRadius}
          onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) } as Partial<ImageElement>)}
          className={inputCls}
        />
      </Field>
      <Field label={t.link}>
        <input
          type="text"
          value={el.linkHref || ''}
          placeholder="https://…"
          onChange={(e) => onUpdate({ linkHref: e.target.value || undefined } as Partial<ImageElement>)}
          className={inputCls}
        />
      </Field>
    </Section>
  );
}

function ButtonSection({ el, onUpdate, t }: { el: ButtonElement; onUpdate: (p: Partial<ButtonElement>) => void; t: typeof T.ru }) {
  return (
    <Section title={t.text}>
      <Field label={t.content}>
        <input
          type="text"
          value={el.label}
          onChange={(e) => onUpdate({ label: e.target.value } as Partial<ButtonElement>)}
          className={inputCls}
        />
      </Field>
      <Field label={t.bgColor}>
        <input
          type="color"
          value={el.bgColor}
          onChange={(e) => onUpdate({ bgColor: e.target.value } as Partial<ButtonElement>)}
        />
      </Field>
      <Field label={t.color}>
        <input
          type="color"
          value={el.textColor}
          onChange={(e) => onUpdate({ textColor: e.target.value } as Partial<ButtonElement>)}
        />
      </Field>
      <Field label={t.borderRadius}>
        <input
          type="number"
          value={el.borderRadius}
          onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) } as Partial<ButtonElement>)}
          className={inputCls}
        />
      </Field>
    </Section>
  );
}

function ShapeSection({ el, onUpdate, t }: { el: ShapeElement; onUpdate: (p: Partial<ShapeElement>) => void; t: typeof T.ru }) {
  return (
    <Section title={t.view}>
      <Field label="Форма">
        <select
          value={el.shape}
          onChange={(e) => onUpdate({ shape: e.target.value as ShapeElement['shape'] } as Partial<ShapeElement>)}
          className={inputCls}
        >
          <option value="rect">Прямоугольник</option>
          <option value="circle">Круг</option>
          <option value="line">Линия</option>
          <option value="star">Звезда</option>
          <option value="arrow">Стрелка</option>
        </select>
      </Field>
      <Field label={t.color}>
        <input
          type="color"
          value={el.fill || '#c9a961'}
          onChange={(e) => onUpdate({ fill: e.target.value } as Partial<ShapeElement>)}
        />
      </Field>
      <Field label={t.opacity}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={el.opacity ?? 1}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) } as Partial<ShapeElement>)}
        />
      </Field>
    </Section>
  );
}

function PositionSection({ el, onUpdate, t }: { el: CanvasElement; onUpdate: (p: Partial<CanvasElement>) => void; t: typeof T.ru }) {
  return (
    <Section title={t.position}>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t.x}>
          <input
            type="number"
            value={Math.round(el.x * 10) / 10}
            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
        <Field label={t.y}>
          <input
            type="number"
            value={Math.round(el.y)}
            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
        <Field label={t.w}>
          <input
            type="number"
            value={Math.round(el.w * 10) / 10}
            onChange={(e) => onUpdate({ w: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
        <Field label={t.h}>
          <input
            type="text"
            value={typeof el.h === 'number' ? Math.round(el.h) : 'auto'}
            onChange={(e) => {
              const v = e.target.value;
              onUpdate({ h: v === 'auto' ? 'auto' : Number(v) });
            }}
            className={inputCls}
          />
        </Field>
        <Field label={t.rot}>
          <input
            type="number"
            value={el.rotation}
            onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
      </div>
    </Section>
  );
}

function CommonActions({
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
  t: typeof T.ru;
  el: CanvasElement;
  onUpdate: (p: Partial<CanvasElement>) => void;
}) {
  return (
    <Section title={t.view}>
      <div className="grid grid-cols-2 gap-2">
        <button className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs" onClick={() => onLayer('front')}>↑ {t.front}</button>
        <button className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs" onClick={() => onLayer('back')}>↓ {t.back}</button>
        <button className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs" onClick={onDuplicate}>⎘ {t.duplicate}</button>
        <button className="rounded bg-rose-900/60 hover:bg-rose-800 px-2 py-1 text-xs" onClick={onDelete}>🗑 {t.delete}</button>
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={!!el.locked} onChange={(e) => onUpdate({ locked: e.target.checked })} />
        {t.lock}
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={!!el.hidden} onChange={(e) => onUpdate({ hidden: e.target.checked })} />
        {t.hide}
      </label>
    </Section>
  );
}

function TemplateSection({ el, onUpdate, t }: { el: CanvasElement; onUpdate: (p: Partial<CanvasElement>) => void; t: typeof T.ru }) {
  return (
    <Section title={t.template}>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!el.editableByEndUser}
          onChange={(e) => onUpdate({ editableByEndUser: e.target.checked })}
        />
        {t.editable}
      </label>
      <Field label={t.bind}>
        <select
          value={el.placeholderKey || ''}
          onChange={(e) => onUpdate({ placeholderKey: (e.target.value || undefined) as CanvasElement['placeholderKey'] })}
          className={inputCls}
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
