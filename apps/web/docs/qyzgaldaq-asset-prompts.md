# «Қызғалдақ» — ассеты для флагманского шаблона (қыз ұзату)

Класть в `apps/web/public/assets/templates/qyzgaldaq/_src/` под этими именами.

## Ревизия после первых проб

Сгенерированные люди не годятся, и дело не в формулировках. На пробах сәукеле
вышел плоским конусом вместо убора с шолпы и подвесками, руки — с типичной
генеративной анатомией, костюм — современным платьем на бретелях вместо
камзола. Аудитория проверяет ровно эти детали первой.

Поэтому **людей не генерируем вообще**. Шаблон строится на орнаменте и
типографике, с несколькими «безопасными» фотографиями, где нет ни лиц, ни рук,
ни костюма: степь, тюльпаны, бархат.

Это не компромисс, а движение к верхнему сегменту: самый дорогой ұзату-шаблон
у toi.com.kz (Silver Sholpy, 4990 ₸) не содержит ни одной фотографии — пять
файлов, все орнаментальные. Премиум в этой категории держится на графике.

Один слот под портрет в шаблоне остаётся — его заполняет покупатель своим
снимком. В демо там стоит не человек, а орнаментальный медальон.

**Чего в наборе намеренно нет:** фактуры бумаги, рваных краёв, состаренных
подложек, сургуча, тиснения — ничего, что притворяется физическим материалом.
Орнамент к этому отношения не имеет: рисунок ничем не притворяется, он просто
рисунок.

**Дисциплина размещений.** Шесть графических файлов дают около двадцати
размещений: каждый работает в двух-трёх масштабах, с поворотами и отражениями.
У toi в премиальном шаблоне пять файлов на одиннадцать размещений — это и есть
правило, по которому набор остаётся маленьким, а страница богатой.

Общее для всех фотографий:

- Вертикальные, 3:4. Кадр строится так, чтобы **правая треть могла уйти за
  край страницы** — значит главное не должно стоять по центру кадра.
- Никакого текста, водяных знаков, логотипов, рамок и виньеток.
- Приглушённая палитра: слива, вино, тёплая охра, слоновая кость. Без
  насыщенного цвета, без «инстаграмной» обработки.
- Ни людей, ни рук, ни костюма, ни лиц. Только пейзаж, растения и ткань.

---

## 1. `steppe.webp` — степь в сумерках

Главный кадр. Уйдёт за правый край, имя ляжет поверх. Людей нет.

```
Photorealistic landscape: the open Kazakh steppe at last light, seen from low
to the ground. A wide flat horizon, dry spring grass in the foreground going
soft with distance, a deep plum-violet twilight sky filling the upper two
thirds with the last warm band of sun along the horizon line. Nothing else —
no people, no animals, no buildings, no roads, no fences, no trees.
Muted desaturated palette: plum, wine, dusty ochre. Low contrast, quiet.
35mm, fine natural grain.
No text, no watermark, no logo, no border. Vertical, 3:4.
```

## 2. `velvet.webp` — бархат

Фактура ткани для тёмной секции. Не имитация материала в CSS, а настоящая
съёмка настоящей ткани — это разные вещи.

```
Photorealistic close-up of deep burgundy silk velvet, laid in soft irregular
folds. Raking light from the left picks out the nap so the pile shifts from
near-black in the hollows to a warm wine sheen on the ridges. Fills the entire
frame. No edges of the cloth, no objects on it, no embroidery, no pattern,
no hands, no people. Rich and quiet, shallow depth of field, fine grain.
No text, no watermark, no logo. Vertical, 3:4.
```

## 3. `dusk-sky.webp` — небо

```
Photorealistic photograph of a twilight sky just after sunset: a smooth
gradient from deep plum-violet at the top through wine to a warm amber band
at the very bottom, with a few faint high clouds and the first stars barely
visible. No horizon line, no land, no birds, no objects — sky only.
Muted and low contrast, fine natural grain.
No text, no watermark, no logo. Vertical, 3:4.
```

## 4. `tulips.webp` — степные тюльпаны

```
Photorealistic close-up of wild red steppe tulips in dry spring grass at
golden hour: three or four blooms, the nearest sharp, the farthest dissolving
into warm bokeh. Low sun from behind, petals translucent and glowing.
Muted warm palette — scarlet, ochre, dusty green. Wild and unmanicured: no
garden beds, no arrangements, no hands, no people.
No text, no watermark, no logo. Vertical, 3:4.
```

## 5. `horizon.webp` — финальный кадр

```
Photorealistic wide landscape: a single dirt track running away across the
open steppe toward a low horizon at last light, seen from standing height.
The track is placed left of centre and disappears into the distance. Sky fills
the upper two thirds — deep plum and amber twilight with the first stars.
Empty and quiet: no people, no animals, no vehicles, no buildings, no poles,
no fences. Cinematic, spacious, muted colour. 35mm, fine natural grain.
No text, no watermark, no logo. Vertical, 3:4.
```

---

## Графика

Для всех шести: **чисто чёрный рисунок на чисто белом фоне.**
`prepare-template-assets.ts` выбивает белое в прозрачность по яркости — серый
или кремовый фон оставит по контуру грязный ореол. Ни текста, ни рамок, ни
подложек, ни теней, ни градиентов внутри рисунка.

Перекрашиваю их в коде под палитру шаблона (золото, вино, слоновая кость),
поэтому цвет в генерации не нужен вообще.

## 6. `tulip.png` — одиночный стебель

Работает в трёх масштабах: очень крупно и бледно за текстом, средне на
вертикальной оси, мелко как знак препинания. Значит должен читаться и в 24px,
и в 300px — без мелкой штриховки.

Соотношение 1:2, вертикальный.

```
Botanical line illustration of a single wild steppe tulip (Tulipa greigii)
on a tall straight stem: one open bloom at the top, two narrow lanceolate
leaves lower down, nothing else. The wild species, not a garden hybrid —
six pointed petals, slightly recurved, never rounded or ruffled.
Pure black ink on pure white background, one confident even line weight
throughout, engraved botanical plate style. No shading, no hatching, no
stippling, no fill, no colour, no text, no frame, no border, no ground line.
The drawing must stay legible when reduced to thumbnail size.
Vertical composition, 1:2, centred with generous white space on all sides.
```

## 7. `oyu-medallion.png` — центральный медальон

Главный культурный знак шаблона. Пойдёт один раз крупно в центр тёмной плашки
и мелко как маркер разделов. Он же задаёт силуэт, по которому можно вырезать
фото вместо банальной арки.

Квадрат 1:1.

```
A single symmetrical Kazakh ornamental medallion built from the қошқар мүйіз
(ram's horn) motif: paired spirals mirrored on both a vertical and a
horizontal axis, resolving into a closed rosette with a clear silhouette.
Flat solid black shapes on pure white background — filled forms, not outlines.
Bold and open enough to stay legible at thumbnail size: no hairline detail, no
fine interior tracery, no shading, no gradient, no colour, no text, no frame.
Centred, square 1:1, with even white space on all four sides.
```

## 8. `oyu-corner.png` — угловой орнамент

Использую четырежды, отражая по обеим осям, — значит должен работать именно
как угол.

Квадрат 1:1.

```
A Kazakh ornamental corner piece in the қошқар мүйіз style, growing from the
top-left corner along both edges and curling inward once. The bottom-right
two thirds of the square must stay completely empty white. Flat solid black
shapes on pure white background — filled forms, not outlines. Bold, open,
legible when small: no hairline detail, no shading, no colour, no text.
Square 1:1.
```

## 9. `rule-tulip.png` — разделитель

Тонкая линейка с тюльпаном по центру. Между разделами, в двух ширинах.

Соотношение 6:1, горизонтальный.

```
A horizontal ornamental divider: a single small steppe tulip bloom at the exact
centre, flanked left and right by one thin straight rule that tapers to a point
at each far end. Two small leaves at the centre where the rule meets the bloom.
Perfectly symmetrical about the centre. Pure black on pure white background,
fine even line weight, engraved botanical style. No shading, no colour, no text.
Wide horizontal composition 6:1, generous white space above and below.
```

## 10. `frame-ring.png` — кольцо вокруг круглого фото

Оно превращает круглое фото из «скруглили радиусом» в оформленный медальон.
Внутри строго пусто — туда встанет фотография.

Квадрат 1:1.

```
A thin decorative circular ring, drawn as a single fine circle with small
evenly spaced ornamental marks around it — alternating tiny dots and short
radial ticks, in the manner of an engraved plate border. The ring occupies the
outer edge of the square; the entire interior is empty pure white. Pure black
on pure white background, fine even line weight, perfectly circular and
concentric. No shading, no colour, no text, no inner pattern.
Square 1:1.
```

## 11. `tulip-field.png` — силуэт для тёмной плашки

Единственный крупный плоский элемент. Ляжет в основание тёмной секции
приглушённым тоном — это графика, а не фактура: сплошной силуэт, без деталей.

Соотношение 3:1, горизонтальный.

```
A silhouette band of wild steppe tulips of uneven heights growing from a
common baseline, as if seen along the ground: slender stems, simple pointed
blooms, a few narrow leaves. Solid flat black shapes on pure white background
— pure silhouette, no outlines, no interior detail, no shading, no texture,
no colour, no text. The composition sits along the bottom edge; the upper half
of the frame stays empty white. Wide horizontal, 3:1, and it must read clearly
as a whole shape rather than as individual drawn flowers.
```

---

## Если генератор упирается

- Рисунок выходит серым или с подложкой → добавьте:
  `pure #000000 line art on pure #FFFFFF background, maximum contrast, no grey
  anti-aliased fill behind the artwork`.
- Тюльпан выходит садовым (махровый, круглые лепестки) →
  `wild species tulip, pointed recurved petals, NOT a cultivated garden hybrid`.
- В кадр лезут люди, силуэты или животные → `completely empty landscape,
  absolutely no people, no figures, no animals anywhere in the frame`.
- Появляется надпись → `absolutely no lettering of any kind`.
- Кадр отцентрован, хотя нужен сдвиг → повторите про пустое место словами
  `strong negative space on the left third of the frame`.

---

## Порядок

Начинать сборку могу с четырёх: **`tulip.png`, `oyu-medallion.png`,
`rule-tulip.png`, `steppe.webp`**. Это скелет — ось, тёмная плашка,
разделители и фон героя. Остальное подключается по мере готовности, на пустых
местах пока заглушки.

Приоритет по влиянию на результат: сначала графика (7, 6, 9, 10), потом фото.
Графика определяет, как шаблон выглядит; фотографии покупатель всё равно
заменит своими.
