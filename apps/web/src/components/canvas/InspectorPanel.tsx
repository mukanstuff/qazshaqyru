'use client';

import { useState } from 'react';
import type {
  CanvasElement,
  TextElement,
  ImageElement,
  ButtonElement,
  ShapeElement,
  DividerElement,
  CoupleNamesElement,
  CountdownElement,
  RsvpFormElement,
  WishesElement,
  ProgramElement,
  MapElement,
  MusicPlayerElement,
  GiftBlockElement,
  QrCodeElement,
  LottieElement,
  VideoBgElement,
  OrnamentElement,
  InvitationCanvasDocument,
  FontFamily,
} from '@/lib/canvas/types';
import { SwatchColorPicker } from './SwatchColorPicker';

interface InspectorProps {
  selected: CanvasElement | null;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onLayer: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  locale: 'ru' | 'kz';
  mode: 'user' | 'template-builder';
  /** Document-level controls (Stage 1). */
  document?: InvitationCanvasDocument;
  onDocumentChange?: (patch: Partial<InvitationCanvasDocument>) => void;
}

// 40 popular fonts (Stage 1) — keep alphabetical-ish but grouped by vibe.
const FONT_OPTIONS: FontFamily[] = [
  // Sans
  'Inter', 'Josefin Sans', 'Manrope', 'Montserrat', 'Nunito', 'Oswald', 'Poppins',
  'Quicksand', 'Raleway', 'Tenor Sans', 'Unbounded', 'Work Sans', 'Bebas Neue',
  'Comfortaa', 'system',
  // Serif
  'Alice', 'Bodoni Moda', 'Cardo', 'Cinzel', 'Cormorant', 'Cormorant Garamond',
  'DM Serif Display', 'EB Garamond', 'Forum', 'Italiana', 'Libre Baskerville',
  'Lora', 'Marcellus', 'Merriweather', 'Old Standard TT', 'PT Serif', 'Philosopher',
  'Playfair Display', 'Prata', 'Spectral', 'Vollkorn', 'Yeseva One',
  // Script / display
  'Dancing Script', 'Great Vibes', 'Marck', 'Pacifico', 'Parisienne', 'Sacramento', 'Tangerine',
];

function FontSelect({
  value,
  onChange,
}: {
  value: FontFamily;
  onChange: (v: FontFamily) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as FontFamily)} className={inputCls}>
      {FONT_OPTIONS.map((f) => (
        <option key={f} value={f}>{f}</option>
      ))}
    </select>
  );
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
    countdown: 'Таймер',
    targetDate: 'Дата события',
    timezone: 'Часовой пояс',
    showLabels: 'Показывать подписи',
    rsvp: 'RSVP',
    askPlusOne: 'Спросить +1',
    askDietary: 'Спросить диету',
    askChildren: 'Спросить детей',
    wishes: 'Пожелания',
    allowAnonymous: 'Разрешить анонимные',
    reactions: 'Реакции (эмодзи)',
    map: 'Карта',
    address: 'Адрес',
    lat: 'Широта',
    lng: 'Долгота',
    zoom: 'Масштаб',
    buttonLabel: 'Текст кнопки',
    music: 'Музыка',
    audioSrc: 'Источник аудио',
    musicAutoplay: 'Автоплей (без звука)',
    trackList: 'Список треков',
    gift: 'Подарки',
    kaspiPhone: 'Телефон Kaspi',
    kaspiCard: 'Карта Kaspi',
    subtitle: 'Подпись',
    showDonors: 'Показывать дарителей',
    qr: 'QR-код',
    qrValue: 'Значение',
    qrSize: 'Размер',
    qrFg: 'Цвет QR',
    qrBg: 'Цвет фона',
    program: 'Программа',
    ornament: 'Орнамент',
    ornamentId: 'ID орнамента',
    lottie: 'Lottie',
    lottieSrc: 'URL Lottie JSON',
    loop: 'Зациклить',
    autoplayLottie: 'Автоплей',
    speed: 'Скорость',
    videoBg: 'Видео-фон',
    videoSrc: 'URL видео',
    posterSrc: 'Постер',
    coupleNames: 'Имена пары',
    firstName: 'Первый',
    secondName: 'Второй',
    connector: 'Разделитель',
    divider: 'Разделитель',
    thickness: 'Толщина',
    lineStyle: 'Стиль',
    title: 'Заголовок',
    document: 'Документ',
    accentColor: 'Цвет акцента',
    docFont: 'Шрифт всего приглашения',
    autoplay: 'Автопрокрутка',
    envelope: 'Конверт',
    location: 'Локация',
    whatsapp: 'WhatsApp',
    rsvpFields: 'RSVP-поля',
    gallery: 'Галерея',
    ogCard: 'OG-карточка',
    slug: 'Slug',
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
    countdown: 'Кері санақ',
    targetDate: 'Оқиға күні',
    timezone: 'Уақыт белдеуі',
    showLabels: 'Жазуларды көрсету',
    rsvp: 'RSVP',
    askPlusOne: '+1 сұрау',
    askDietary: 'Диета сұрау',
    askChildren: 'Балаларды сұрау',
    wishes: 'Тілектер',
    allowAnonymous: 'Анонимді рұқсат',
    reactions: 'Реакциялар (эмодзи)',
    map: 'Карта',
    address: 'Мекенжай',
    lat: 'Ендік',
    lng: 'Бойлық',
    zoom: 'Масштаб',
    buttonLabel: 'Батырма мәтіні',
    music: 'Музыка',
    audioSrc: 'Аудио көзі',
    musicAutoplay: 'Автоплей (дыбыссыз)',
    trackList: 'Тректер тізімі',
    gift: 'Сыйлықтар',
    kaspiPhone: 'Kaspi телефон',
    kaspiCard: 'Kaspi карта',
    subtitle: 'Қолтаңба',
    showDonors: 'Донорларды көрсету',
    qr: 'QR-код',
    qrValue: 'Мән',
    qrSize: 'Өлшем',
    qrFg: 'QR түсі',
    qrBg: 'Фон түсі',
    program: 'Бағдарлама',
    ornament: 'Ою-өрнек',
    ornamentId: 'Ою-өрнек ID',
    lottie: 'Lottie',
    lottieSrc: 'Lottie JSON URL',
    loop: 'Қайталау',
    autoplayLottie: 'Автоплей',
    speed: 'Жылдамдық',
    videoBg: 'Видео фон',
    videoSrc: 'Видео URL',
    posterSrc: 'Постер',
    coupleNames: 'Жұп есімдері',
    firstName: 'Бірінші',
    secondName: 'Екінші',
    connector: 'Аралық',
    divider: 'Бөлгіш',
    thickness: 'Қалыңдық',
    lineStyle: 'Стиль',
    title: 'Тақырып',
    document: 'Құжат',
    accentColor: 'Акцент түсі',
    docFont: 'Барлық шақыру қарпі',
    autoplay: 'Автопрокрутка',
    envelope: 'Конверт',
    location: 'Орналасқан жері',
    whatsapp: 'WhatsApp',
    rsvpFields: 'RSVP өрістері',
    gallery: 'Галерея',
    ogCard: 'OG-карточка',
    slug: 'Slug',
  },
};

export function InspectorPanel(props: InspectorProps) {
  const { selected, onUpdate, onDelete, onDuplicate, onLayer, locale, mode, document, onDocumentChange } = props;
  const t = T[locale];
  const [tab, setTab] = useState<'element' | 'document'>('element');

  if (!selected && !document) {
    return (
      <aside className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-400">
        {t.emptyHint}
      </aside>
    );
  }

  // Empty selection but we have a document → show only the Document tab.
  const noSelection = !selected;
  const isText = !noSelection && (selected.type === 'text' || selected.type === 'heading');
  const isImage = !noSelection && selected.type === 'image';
  const isButton = !noSelection && selected.type === 'button';
  const isShape = !noSelection && selected.type === 'shape';
  const isCountdown = !noSelection && selected.type === 'countdown';
  const isRsvp = !noSelection && selected.type === 'rsvp-form';
  const isWishes = !noSelection && selected.type === 'wishes';
  const isProgram = !noSelection && selected.type === 'program';
  const isMap = !noSelection && selected.type === 'map';
  const isMusic = !noSelection && selected.type === 'music';
  const isGift = !noSelection && selected.type === 'gift';
  const isQr = !noSelection && selected.type === 'qr';
  const isLottie = !noSelection && selected.type === 'lottie';
  const isVideoBg = !noSelection && selected.type === 'video-bg';
  const isOrnament = !noSelection && selected.type === 'ornament';
  const isDivider = !noSelection && selected.type === 'divider';
  const isCoupleNames = !noSelection && selected.type === 'couple-names';

  const showElement = !noSelection && tab === 'element';
  const showDocument = tab === 'document';

  return (
    <aside className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-900/80 text-sm text-zinc-100 flex flex-col">
      <div className="flex border-b border-zinc-800 text-xs">
        <button
          type="button"
          aria-pressed={tab === 'element'}
          onClick={() => setTab('element')}
          className={
            'flex-1 py-2 font-semibold ' +
            (tab === 'element' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/60')
          }
        >
          {locale === 'ru' ? 'Элемент' : 'Элемент'}
        </button>
        <button
          type="button"
          aria-pressed={tab === 'document'}
          onClick={() => setTab('document')}
          className={
            'flex-1 py-2 font-semibold ' +
            (tab === 'document' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/60')
          }
        >
          {locale === 'ru' ? 'Документ' : 'Құжат'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {showElement && noSelection && (
          <div className="text-xs text-zinc-400">{t.emptyHint}</div>
        )}

        {showElement && !noSelection && (
          <>
            {isText && <TextSection el={selected as TextElement} onUpdate={onUpdate} t={t} />}
            {isImage && <ImageSection el={selected as ImageElement} onUpdate={onUpdate} t={t} />}
            {isButton && <ButtonSection el={selected as ButtonElement} onUpdate={onUpdate} t={t} />}
            {isShape && <ShapeSection el={selected as ShapeElement} onUpdate={onUpdate} t={t} />}
            {isCoupleNames && <CoupleNamesSection el={selected as CoupleNamesElement} onUpdate={onUpdate} t={t} />}
            {isCountdown && <CountdownSection el={selected as CountdownElement} onUpdate={onUpdate} t={t} />}
            {isRsvp && <RsvpFormSection el={selected as RsvpFormElement} onUpdate={onUpdate} t={t} />}
            {isWishes && <WishesSection el={selected as WishesElement} onUpdate={onUpdate} t={t} />}
            {isProgram && <ProgramSection el={selected as ProgramElement} onUpdate={onUpdate} t={t} />}
            {isMap && <MapSection el={selected as MapElement} onUpdate={onUpdate} t={t} />}
            {isMusic && <MusicSection el={selected as MusicPlayerElement} onUpdate={onUpdate} t={t} />}
            {isGift && <GiftSection el={selected as GiftBlockElement} onUpdate={onUpdate} t={t} />}
            {isQr && <QrSection el={selected as QrCodeElement} onUpdate={onUpdate} t={t} />}
            {isLottie && <LottieSection el={selected as LottieElement} onUpdate={onUpdate} t={t} />}
            {isVideoBg && <VideoBgSection el={selected as VideoBgElement} onUpdate={onUpdate} t={t} />}
            {isOrnament && <OrnamentSection el={selected as OrnamentElement} onUpdate={onUpdate} t={t} />}
            {isDivider && <DividerSection el={selected as DividerElement} onUpdate={onUpdate} t={t} />}

            <PositionSection el={selected} onUpdate={onUpdate} t={t} />
            <CommonActions onDelete={onDelete} onDuplicate={onDuplicate} onLayer={onLayer} t={t} el={selected} onUpdate={onUpdate} />
            {mode === 'template-builder' && <TemplateSection el={selected} onUpdate={onUpdate} t={t} />}
          </>
        )}

        {showDocument && document && onDocumentChange && (
          <DocumentSection doc={document} onChange={onDocumentChange} t={t} locale={locale} />
        )}
      </div>
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
          <FontSelect value={el.fontFamily} onChange={(v) => onUpdate({ fontFamily: v } as Partial<TextElement>)} />
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
          <SwatchColorPicker value={el.color} onChange={(c) => onUpdate({ color: c } as Partial<TextElement>)} />
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
        <SwatchColorPicker value={el.bgColor} onChange={(c) => onUpdate({ bgColor: c } as Partial<ButtonElement>)} />
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.textColor} onChange={(c) => onUpdate({ textColor: c } as Partial<ButtonElement>)} />
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
        <SwatchColorPicker value={el.fill || '#c9a961'} onChange={(c) => onUpdate({ fill: c } as Partial<ShapeElement>)} />
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

// ─── Feature-rich inspector sections (Stage 0) ────────────────────────────

function CoupleNamesSection({
  el,
  onUpdate,
  t,
}: {
  el: CoupleNamesElement;
  onUpdate: (p: Partial<CoupleNamesElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.coupleNames}>
      <Field label={t.firstName}>
        <input
          type="text"
          value={el.first}
          onChange={(e) => onUpdate({ first: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label={t.secondName}>
        <input
          type="text"
          value={el.second}
          onChange={(e) => onUpdate({ second: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label={t.connector}>
        <select
          value={el.connector}
          onChange={(e) => onUpdate({ connector: e.target.value as CoupleNamesElement['connector'] })}
          className={inputCls}
        >
          <option value="&">&amp;</option>
          <option value="heart">♥</option>
          <option value="ornament">❀</option>
          <option value="және">және</option>
          <option value="и">и</option>
        </select>
      </Field>
      <Field label={t.font}>
        <FontSelect value={el.font} onChange={(v) => onUpdate({ font: v })} />
      </Field>
      <Field label={t.size}>
        <input
          type="number"
          value={el.fontSize}
          min={12}
          max={120}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.color} onChange={(c) => onUpdate({ color: c })} />
      </Field>
      <Field label={t.color + ' (коннектор)'}>
        <SwatchColorPicker value={el.connectorColor || '#c9a961'} onChange={(c) => onUpdate({ connectorColor: c })} />
      </Field>
    </Section>
  );
}

function CountdownSection({
  el,
  onUpdate,
  t,
}: {
  el: CountdownElement;
  onUpdate: (p: Partial<CountdownElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.countdown}>
      <Field label={t.targetDate}>
        <input
          type="datetime-local"
          value={el.targetIso ? el.targetIso.slice(0, 16) : ''}
          onChange={(e) => onUpdate({ targetIso: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.timezone}>
        <select
          value={el.timezone || 'Asia/Almaty'}
          onChange={(e) => onUpdate({ timezone: e.target.value })}
          className={inputCls}
        >
          <option value="Asia/Almaty">Asia/Almaty</option>
          <option value="Asia/Astana">Asia/Astana</option>
          <option value="Europe/Moscow">Europe/Moscow</option>
          <option value="UTC">UTC</option>
        </select>
      </Field>
      <Field label={t.font}>
        <FontSelect value={el.fontFamily} onChange={(v) => onUpdate({ fontFamily: v })} />
      </Field>
      <Field label={t.size}>
        <input
          type="number"
          value={el.fontSize}
          min={12}
          max={96}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.color} onChange={(c) => onUpdate({ color: c })} />
      </Field>
      <Field label={t.color + ' (акцент)'}>
        <SwatchColorPicker value={el.accentColor || '#c9a961'} onChange={(c) => onUpdate({ accentColor: c })} />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!el.showLabels}
          onChange={(e) => onUpdate({ showLabels: e.target.checked })}
        />
        {t.showLabels}
      </label>
    </Section>
  );
}

function RsvpFormSection({
  el,
  onUpdate,
  t,
}: {
  el: RsvpFormElement;
  onUpdate: (p: Partial<RsvpFormElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.rsvp}>
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
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!el.askPlusOne}
          onChange={(e) => onUpdate({ askPlusOne: e.target.checked })}
        />
        {t.askPlusOne}
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!el.askDietary}
          onChange={(e) => onUpdate({ askDietary: e.target.checked })}
        />
        {t.askDietary}
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!el.askChildren}
          onChange={(e) => onUpdate({ askChildren: e.target.checked })}
        />
        {t.askChildren}
      </label>
    </Section>
  );
}

function WishesSection({
  el,
  onUpdate,
  t,
}: {
  el: WishesElement;
  onUpdate: (p: Partial<WishesElement>) => void;
  t: typeof T.ru;
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
      <label className="flex items-center gap-2 text-xs">
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

function ProgramSection({
  el,
  onUpdate,
  t,
}: {
  el: ProgramElement;
  onUpdate: (p: Partial<ProgramElement>) => void;
  t: typeof T.ru;
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
      <Field label={t.title}>
        <input
          type="text"
          value={el.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <div className="space-y-2">
        {el.items.map((it, idx) => (
          <div key={it.id} className="rounded border border-zinc-700 p-2 space-y-1">
            <input
              type="text"
              value={it.time}
              placeholder="16:00"
              onChange={(e) => updateItem(idx, { time: e.target.value })}
              className={inputCls}
            />
            <input
              type="text"
              value={it.title}
              placeholder={t.title}
              onChange={(e) => updateItem(idx, { title: e.target.value })}
              className={inputCls}
            />
            <button
              type="button"
              className="text-[10px] text-rose-300 hover:text-rose-200"
              onClick={() => removeItem(idx)}
            >
              ✕ удалить
            </button>
          </div>
        ))}
        <button
          type="button"
          className="w-full rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-xs"
          onClick={addItem}
        >
          + добавить пункт
        </button>
      </div>
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
    </Section>
  );
}

function MapSection({
  el,
  onUpdate,
  t,
}: {
  el: MapElement;
  onUpdate: (p: Partial<MapElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.map}>
      <Field label={t.address}>
        <input
          type="text"
          value={el.address || ''}
          onChange={(e) => onUpdate({ address: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.lat}>
        <input
          type="number"
          step="0.0001"
          value={el.lat ?? ''}
          onChange={(e) => onUpdate({ lat: e.target.value ? Number(e.target.value) : undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.lng}>
        <input
          type="number"
          step="0.0001"
          value={el.lng ?? ''}
          onChange={(e) => onUpdate({ lng: e.target.value ? Number(e.target.value) : undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.zoom}>
        <input
          type="number"
          min={1}
          max={20}
          value={el.zoom ?? 14}
          onChange={(e) => onUpdate({ zoom: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <Field label={t.buttonLabel}>
        <input
          type="text"
          value={el.buttonLabel || ''}
          onChange={(e) => onUpdate({ buttonLabel: e.target.value || undefined })}
          className={inputCls}
          placeholder="Открыть карту"
        />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!el.showStaticOnly}
          onChange={(e) => onUpdate({ showStaticOnly: e.target.checked })}
        />
        Только статичная карта
      </label>
    </Section>
  );
}

function MusicSection({
  el,
  onUpdate,
  t,
}: {
  el: MusicPlayerElement;
  onUpdate: (p: Partial<MusicPlayerElement>) => void;
  t: typeof T.ru;
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
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!el.autoPlayMuted}
          onChange={(e) => onUpdate({ autoPlayMuted: e.target.checked })}
        />
        {t.musicAutoplay}
      </label>
      <Field label={t.trackList}>
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
          className={inputCls + ' w-full h-20 resize-none'}
          placeholder={'Трек 1|https://…\nТрек 2|https://…'}
        />
      </Field>
    </Section>
  );
}

function GiftSection({
  el,
  onUpdate,
  t,
}: {
  el: GiftBlockElement;
  onUpdate: (p: Partial<GiftBlockElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.gift}>
      <Field label={t.title}>
        <input
          type="text"
          value={el.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.subtitle || t.title}>
        <input
          type="text"
          value={el.subtitle || ''}
          onChange={(e) => onUpdate({ subtitle: e.target.value || undefined })}
          className={inputCls}
        />
      </Field>
      <Field label={t.kaspiPhone}>
        <input
          type="text"
          value={el.kaspiPhone || ''}
          onChange={(e) => onUpdate({ kaspiPhone: e.target.value || undefined })}
          className={inputCls}
          placeholder="+7 700 000 0000"
        />
      </Field>
      <Field label={t.kaspiCard}>
        <input
          type="text"
          value={el.kaspiCard || ''}
          onChange={(e) => onUpdate({ kaspiCard: e.target.value || undefined })}
          className={inputCls}
          placeholder="4400 4301 …"
        />
      </Field>
      <Field label={t.color + ' (акцент)'}>
        <SwatchColorPicker value={el.accentColor} onChange={(c) => onUpdate({ accentColor: c })} />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!el.showDonors}
          onChange={(e) => onUpdate({ showDonors: e.target.checked })}
        />
        {t.showDonors}
      </label>
    </Section>
  );
}

function QrSection({
  el,
  onUpdate,
  t,
}: {
  el: QrCodeElement;
  onUpdate: (p: Partial<QrCodeElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.qr}>
      <Field label={t.qrValue}>
        <input
          type="text"
          value={el.value || ''}
          onChange={(e) => onUpdate({ value: e.target.value || undefined })}
          className={inputCls}
          placeholder="URL или текст"
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
      <Field label="Коррекция">
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

function LottieSection({
  el,
  onUpdate,
  t,
}: {
  el: LottieElement;
  onUpdate: (p: Partial<LottieElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.lottie}>
      <Field label={t.lottieSrc}>
        <input
          type="text"
          value={el.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          className={inputCls}
          placeholder="https://…lottie.json"
        />
      </Field>
      <Field label={t.speed}>
        <input
          type="number"
          step="0.1"
          min={0.1}
          max={3}
          value={el.speed}
          onChange={(e) => onUpdate({ speed: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={!!el.loop} onChange={(e) => onUpdate({ loop: e.target.checked })} />
        {t.loop}
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={!!el.autoplay}
          onChange={(e) => onUpdate({ autoplay: e.target.checked })}
        />
        {t.autoplayLottie}
      </label>
    </Section>
  );
}

function VideoBgSection({
  el,
  onUpdate,
  t,
}: {
  el: VideoBgElement;
  onUpdate: (p: Partial<VideoBgElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.videoBg}>
      <Field label={t.videoSrc}>
        <input
          type="text"
          value={el.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          className={inputCls}
          placeholder="https://…mp4"
        />
      </Field>
      <Field label={t.posterSrc}>
        <input
          type="text"
          value={el.posterSrc || ''}
          onChange={(e) => onUpdate({ posterSrc: e.target.value || undefined })}
          className={inputCls}
          placeholder="https://…jpg"
        />
      </Field>
      <Field label={t.color + ' (overlay)'}>
        <SwatchColorPicker value={el.overlayColor || '#000000'} onChange={(c) => onUpdate({ overlayColor: c })} />
      </Field>
      <Field label={t.opacity}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={el.opacity ?? 1}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
        />
      </Field>
    </Section>
  );
}

function OrnamentSection({
  el,
  onUpdate,
  t,
}: {
  el: OrnamentElement;
  onUpdate: (p: Partial<OrnamentElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.ornament}>
      <Field label={t.ornamentId}>
        <select
          value={el.ornamentId}
          onChange={(e) => onUpdate({ ornamentId: e.target.value })}
          className={inputCls}
        >
          <option value="oy-1">Ою-өрнек 1</option>
          <option value="oy-2">Ою-өрнек 2</option>
          <option value="oy-3">Ою-өрнек 3</option>
          <option value="oy-4">Ою-өрнек 4</option>
        </select>
      </Field>
      <Field label={t.color}>
        <SwatchColorPicker value={el.color || '#c9a961'} onChange={(c) => onUpdate({ color: c })} />
      </Field>
      <Field label="URL (свой)">
        <input
          type="text"
          value={el.src || ''}
          onChange={(e) => onUpdate({ src: e.target.value || undefined })}
          className={inputCls}
          placeholder="https://…svg"
        />
      </Field>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={!!el.flipX} onChange={(e) => onUpdate({ flipX: e.target.checked })} />
        Отразить по X
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={!!el.flipY} onChange={(e) => onUpdate({ flipY: e.target.checked })} />
        Отразить по Y
      </label>
    </Section>
  );
}

function DividerSection({
  el,
  onUpdate,
  t,
}: {
  el: DividerElement;
  onUpdate: (p: Partial<DividerElement>) => void;
  t: typeof T.ru;
}) {
  return (
    <Section title={t.divider}>
      <Field label={t.color}>
        <SwatchColorPicker value={el.color} onChange={(c) => onUpdate({ color: c } as Partial<DividerElement>)} />
      </Field>
      <Field label={t.thickness}>
        <input
          type="number"
          min={1}
          max={20}
          value={el.thickness}
          onChange={(e) => onUpdate({ thickness: Number(e.target.value) })}
          className={inputCls}
        />
      </Field>
      <Field label={t.lineStyle}>
        <select
          value={el.style}
          onChange={(e) => onUpdate({ style: e.target.value as DividerElement['style'] })}
          className={inputCls}
        >
          <option value="solid">solid</option>
          <option value="dashed">dashed</option>
          <option value="dotted">dotted</option>
          <option value="ornament">ornament</option>
        </select>
      </Field>
    </Section>
  );
}

// --- Stage 1: Document-level controls (toi.com.kz long scroll) ---
function DocumentSection({
  doc,
  onChange,
  t,
  locale,
}: {
  doc: InvitationCanvasDocument;
  onChange: (patch: Partial<InvitationCanvasDocument>) => void;
  t: typeof T.ru;
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
        <label className="flex items-center gap-2 text-xs">
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
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!docAny.rsvpAskPlusOne}
            onChange={(e) =>
              onChange({ rsvpAskPlusOne: e.target.checked } as Partial<InvitationCanvasDocument>)
            }
          />
          +1 (с кем)
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!docAny.rsvpAskDietary}
            onChange={(e) =>
              onChange({ rsvpAskDietary: e.target.checked } as Partial<InvitationCanvasDocument>)
            }
          />
          Диета / аллергии
        </label>
        <label className="flex items-center gap-2 text-xs">
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
