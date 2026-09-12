import type { FontFamily } from '@/lib/canvas/types';

// Kazakh-verified fonts only. "Supports Cyrillic" is NOT sufficient: Ә Ғ Қ Ң
// Ө Ұ Ү Һ live outside the base `cyrillic` subset, and a font missing them
// renders Kazakh words half in the chosen face and half in a system fallback.
// See KAZAKH_SUBSTITUTE in elements/fontStack.ts for the verification method
// and for the six families excluded here because they fail it.
export const FONT_OPTIONS: FontFamily[] = [
  // Self-hosted
  'Oranienbaum', 'Monolog', 'Corinthia', 'Copperplate', 'Andantino', 'Lavanderia', 'DomainDisplay', 'CeraBlack',
  'Shelley', 'Monumenta', 'Romul', 'Ametist', 'GoodVibes',
  // Sans
  'Inter', 'Montserrat', 'Nunito', 'Oswald',
  'Raleway', 'Comfortaa', 'system',
  // Serif
  'Alice', 'Cormorant', 'Cormorant Garamond',
  'EB Garamond', 'Forum',
  'Lora', 'Merriweather', 'Old Standard TT', 'PT Serif', 'Philosopher',
  'Prata', 'Spectral', 'Vollkorn', 'Yeseva One',
  // Script / display
  'Pacifico',
];

export function FontSelect({
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

export const T = {
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
    /* Seven inspector fields built their label as `t.color + ' (акцент)'`, so a
       Kazakh editor read «Түс (акцент)». The qualifier belongs in the
       dictionary like every other word. */
    colorAccent: 'Цвет акцента',
    colorConnector: 'Цвет коннектора',
    colorOverlay: 'Цвет затемнения',
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
    whatsappRsvp: 'WhatsApp (для ответа)',
    whatsappRsvpHint: 'Гость увидит кнопку «Ответить через WhatsApp» рядом с формой. Оставьте пустым, чтобы скрыть.',
    wishes: 'Пожелания',
    allowAnonymous: 'Разрешить анонимные',
    reactions: 'Реакции (эмодзи)',
    map: 'Карта',
    address: 'Адрес',
    buttonLabel: 'Текст кнопки',
    music: 'Музыка',
    audioSrc: 'Источник аудио',
    musicAutoplay: 'Автоплей (без звука)',
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
    addItem: 'Добавить пункт',
    errorCorrection: 'Коррекция',
    urlOrText: 'URL или текст',
    shapeType: 'Форма',
    shapeRect: 'Прямоугольник',
    shapeCircle: 'Круг',
    shapeLine: 'Линия',
    shapeStar: 'Звезда',
    shapeArrow: 'Стрелка',
    openMapPlaceholder: 'Открыть карту',
    staticMapOnly: 'Только статичная карта',
    flipX: 'Отразить по X',
    flipY: 'Отразить по Y',
    customUrl: 'URL (свой)',
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
    colorAccent: 'Акцент түсі',
    colorConnector: 'Байланыстырушы түсі',
    colorOverlay: 'Күңгірттеу түсі',
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
    whatsappRsvp: 'WhatsApp (жауап үшін)',
    whatsappRsvpHint: 'Қонақ форманың жанынан «WhatsApp арқылы жауап беру» батырмасын көреді. Бос қалдырсаңыз — жасырылады.',
    wishes: 'Тілектер',
    allowAnonymous: 'Анонимді рұқсат',
    reactions: 'Реакциялар (эмодзи)',
    map: 'Карта',
    address: 'Мекенжай',
    buttonLabel: 'Батырма мәтіні',
    music: 'Музыка',
    audioSrc: 'Аудио көзі',
    musicAutoplay: 'Автоплей (дыбыссыз)',
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
    addItem: 'Тармақ қосу',
    errorCorrection: 'Түзету',
    urlOrText: 'URL немесе мәтін',
    shapeType: 'Пішін',
    shapeRect: 'Төртбұрыш',
    shapeCircle: 'Шеңбер',
    shapeLine: 'Сызық',
    shapeStar: 'Жұлдыз',
    shapeArrow: 'Көрсеткі',
    openMapPlaceholder: 'Картаны ашу',
    staticMapOnly: 'Тек статикалық карта',
    flipX: 'X бойынша шағылыстыру',
    flipY: 'Y бойынша шағылыстыру',
    customUrl: 'URL (өз сілтемеңіз)',
  },
};

export type InspectorT = typeof T.ru;

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ci-section">
      <h4 className="ci-section-title">{title}</h4>
      <div>{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="ci-row">
      <span className="ci-row-label">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = 'canvas-inspector-input';
export const numCls = 'canvas-inspector-num';
export const textCls = 'canvas-inspector-input';
