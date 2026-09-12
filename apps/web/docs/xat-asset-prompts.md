# «Хат» — ассеты

**11 файлов. Видео уже есть.**

Первая версия этого документа просила 36. Это была ошибка не в списке, а в
конструкции: каждый приём я посадил на отдельный файл — лента 3, отпечатки 3,
иконки 5, промытые фоны 6. У toi 4–14 файлов на шаблон (медиана 7), и они
получают из пяти файлов двадцать одно размещение, потому что один и тот же
кусок стоит в трёх размерах, с поворотами и разными тинтами.

Сейчас: **13 файлов, 42 размещения** (считано по собранному документу, из них
2 — видео и его постер). Промытые фоны берут те же снимки, что и галерея;
отпечатки — тоже; навершия ленты — тот же картуш; иконки программы убраны, их
место заняла нить со временем.

## Куда класть

Всё в `apps/web/public/assets/templates/xat/`, потом я прогоню:

```bash
npx tsx scripts/prepare-template-assets.ts xat
```

Расширение при генерации любое — конвейер приведёт к нужному. Префикс решает,
что скрипт сделает:

- `oyu-*` → белое в прозрачность, рисунок принудительно чёрный, PNG.
  Красится в коде под палитру, поэтому цвет генерации не важен.
- `cut-*` → чёрное в прозрачность, **цвет сохраняется**, WebP.
- `paper*` → WebP повышенного качества с ретонировкой.

---

## Уже сделано

`video/envelope-open.mp4` — принято, стоит в шаблоне. Постер взят первым кадром
самого клипа, отдельный файл не нужен.

Отдельный вертикальный снимок запечатанного конверта лежит в `_src/` как
запаска: в шаблон его не ставлю — гейт четыре секунды показывает конверт, и
открыть его, чтобы увидеть ещё один конверт, значит потерять момент.

`Candlelight_moving_across_paper` — **не годится, и не нужен вовсе.** Модель
поставила в кадр горящую свечу, которая едет по бумаге вбок, и петля не
сходится: первый и последний кадр разные, на стыке будет рывок. Но главное —
я не сделал в шаблоне ни одного места, где играет фоновое видео, так что этот
промпт был лишним с самого начала. Перегенерировать не надо.

---

## Общее для четырёх фотографий

Каждая работает трижды: как сама себя, как промытый фон под текстом
(обесцвечена до 62% и залита бумагой на 55–98%) и как вклеенный отпечаток в
белом поле. Поэтому кадр должен читаться и крупным, и полностью размытым.

- **Вертикальные, 3:4.**
- **Ни одного лица. Ни одной фигуры. Ни одной руки.** Ни силуэтов на заднем
  плане, ни отражений.
- **Город.** Ресторан или банкетный зал Алматы или Астаны: паркет, лепнина,
  панорамные окна, тёплый электрический свет, стекло, латунь, лён. Никакой
  степи, юрт, лошадей, пиал, аула.
- Не костёл и не европейская свадьба: ни арок под открытым небом, ни витражей.
- Палитра: слоновая кость, песок, тёплый серый, латунь, приглушённый эвкалипт.
  Без насыщенного цвета, без оранжево-бирюзового грейда.
- Свет мягкий, направленный сбоку. Не полдень, не вспышка.
- Ни текста, ни логотипов, ни водяных знаков, ни рамок.

## 1. `hero.jpg` — открывает страницу

Поверх ложатся имена, поэтому нижняя треть должна быть спокойной и тёмной.

```
Photorealistic vertical photograph, 3:4. A long banquet table in a modern
Almaty restaurant in the evening, seen from a low angle close to the tabletop
with the room falling out of focus behind. In focus in the upper middle:
ivory garden roses and eucalyptus in a low brass bowl, a linen napkin, the rim
of a crystal glass catching warm light. The lower third of the frame is quiet,
darker tablecloth and shadow, with nothing detailed in it.

Warm restrained palette: ivory, sand, warm grey, brass, muted eucalyptus
green. Soft directional side light, shallow depth of field, 50mm, fine natural
grain.

No people, no faces, no hands, no silhouettes, no reflections of people. No
steppe, no yurt, no horses, no outdoor arch, no church. No text, no logo, no
watermark, no border. Not glossy, not CGI-looking.
```

## 2. `gallery-1.jpg` — кольца

```
Photorealistic vertical photograph, 3:4, extreme close-up. Two plain polished
gold wedding rings resting on a fold of heavy ivory silk. Warm directional
light from one side catches the inner curve of each ring and throws a small
bright caustic onto the silk. Very shallow depth of field: the front ring is
sharp, the fabric behind melts away.

Palette: ivory, warm gold, soft shadow. 100mm macro, fine natural grain.

No people, no hands, no faces. No boxes, no cushions, no flowers, no text, no
logo, no watermark, no border. Not glossy, not CGI-looking.
```

## 3. `gallery-2.jpg` — бокалы

```
Photorealistic vertical photograph, 3:4. Three crystal glasses standing close
together on a linen tablecloth, photographed nearly at table level against a
warm out-of-focus restaurant interior in the evening. Light passes through the
glass and lays soft bright shapes on the linen. Only the near glass is sharp.

Palette: ivory, warm grey, brass, amber highlights. Soft directional light,
shallow depth of field, 50mm, fine natural grain.

No people, no faces, no hands, no silhouettes, no reflections of people. No
text, no logo, no watermark, no border. Not glossy, not CGI-looking.
```

## 4. `gallery-3.jpg` — цветы

```
Photorealistic vertical photograph, 3:4. A loose arrangement of ivory garden
roses, white ranunculus and eucalyptus lying on a linen cloth, seen from
slightly above and to one side. Petals and leaves fill most of the frame; a
band of bare linen runs along one edge. Soft even daylight from a window out
of frame.

Palette: ivory, cream, muted eucalyptus green, warm linen. Shallow depth of
field, 50mm, fine natural grain.

No people, no hands, no faces. No vases, no ribbons, no text, no logo, no
watermark, no border. Not glossy, not CGI-looking, not oversaturated.
```

## 5. `closing.jpg` — последний кадр

Поверх ложится одна строка, поэтому верхняя треть должна быть тёмной и простой.

```
Photorealistic vertical photograph, 3:4. A dressed banquet table photographed
from close to its surface at the end of an evening: candles burned low, glasses
catching warm light, ivory flowers loosening, the room behind deep and softly
out of focus. Quiet and warm rather than celebratory. The upper third of the
frame is dark and simple.

Palette: ivory, amber, brass, deep warm shadow. Soft low lighting, shallow
depth of field, 50mm, fine natural grain.

No people, no faces, no hands, no silhouettes. No text, no logo, no watermark,
no border. Not glossy, not CGI-looking.
```

---

## Материалы

## 6. `paper.jpg` — фактура страницы

Тайлится под всей страницей, поэтому свет должен быть ровным от угла до угла.
Через отрицания («пустой лист, ничего нет») этот кадр не генерируется — модель
отдаёт ошибку. Промпт описывает то, что видно.

```
Macro texture photograph of a sheet of heavy cream cotton paper, filling the
entire frame, shot straight down under soft even light. The surface shows fine
paper fibre, a faint irregular laid grain and very slight undulation, with
gentle tonal variation across the sheet. Warm ivory tone throughout, low
contrast, no strong shadows and no bright highlights.

Square, 1:1. Even illumination corner to corner so the texture can be tiled.
Nothing on the paper, nothing beside it, edges of the sheet not visible.
```

## 7. `paper-edge-torn.jpg` — рваный край

Ложится поперёк нижнего края геройской фотографии — это тот самый шов, ради
которого шаблон так называется.

```
Macro photograph of the torn edge of a sheet of heavy cream cotton paper, lit
softly from one side, photographed against a pure black (#000000) background
so the paper is the only thing visible.

Wide horizontal strip, aspect ratio 6:1. The torn edge runs the full width of
the frame with its characteristic feathered deckle: exposed fibres, a slightly
lighter inner layer along the tear, and a soft natural shadow just under the
lip. Above the tear is a band of plain paper surface; below the tear is pure
black.

Warm ivory paper on pure black. No text, no writing, no printing, no logo, no
watermark, no hands, no other objects, no grey background — the background is
pure black only.
```

## 8. `cut-print-corner.jpg` — фотоуголок

Шесть размещений: держит по два угла у каждого из трёх вклеенных отпечатков.

```
Macro photograph of a single traditional photo-album mounting corner,
photographed straight down against a pure black (#000000) background so the
corner is the only thing visible.

A small triangular pocket of aged ivory paper, the kind glued into a photo
album to hold a print, seen face on with its diagonal opening across the
front. Fine paper texture, softly lit from the upper left, a faint natural
shadow along one edge. Square framing, the corner centred with black all
around it.

No photograph in it, no album page, no text, no writing, no logo, no
watermark, no hands, no other objects. No grey background, no gradient
background — pure black only.
```

---

## Орнамент

Самое сложное в наборе: модель по умолчанию отдаёт кельтский узел, греческую
волюту или мандалу. Работают три вещи, и выкидывать их из промпта нельзя:

1. назвать технику — «войлочная аппликация», а не «орнамент»;
2. `arranged as a folded paper cut-out` — фраза, которая убивает вертушку и
   заставляет делать зеркальную симметрию;
3. описывать **рог**, а не спираль: короткий стебель, две руки, каждая
   заворачивается примерно на 200° и кончается **тупой скруглённой булавой**.
   Слово `spiral` не писать вообще — оно перевешивает казахское ою в любых
   обучающих данных.

Отбраковка тут высокая: закладывай по три-четыре генерации на каждый файл.

## 9. `oyu-band-tile.png` — бесшовная вертикальная лента

Шесть размещений: из неё собирается кант, идущий через всю страницу. Стык
обязан быть незаметным.

```
A Kazakh oyu-ornek border strip rendered as a cut-felt appliqué panel (qiyq
oyu / syrmaq) from a Central Asian steppe nomad textile, drawn as a flat pure
black (#000000) silhouette on a pure white (#FFFFFF) background.

Tall narrow vertical strip, aspect ratio 1:4. The pattern is a single motif
repeated down the strip and must tile seamlessly: the design at the very top
edge continues exactly into the design at the very bottom edge, so copies
stacked end to end join invisibly. Strict bilateral mirror symmetry about the
vertical centre axis, arranged as a folded paper cut-out.

The motif is a ram's-horn element: a short stem splitting into two symmetric
arms, each sweeping outward and hooking back through about 200 degrees and
ending in a BLUNT ROUNDED CLUB. The arms never coil more than once and never
taper to a point. All ribbons are thick and of near-constant width, about one
tenth of the strip's width, and the white gaps between ribbons are the same
width as the ribbons themselves.

No Celtic knotwork, no triskelion, no Archimedean coils, no concentric rings,
no Art Nouveau whiplash, no paisley, no Arabic arabesque, no Chinese cloud
scroll, no acanthus, no mandala, no flowers, no leaves, no calligraphy, no
text, no letters, no frame, no border box, no watermark, no shading, no
gradient, no grey — pure black on pure white only.
```

## 10. `oyu-rosette.png` — картуш

Одиннадцать размещений: декор по краям всех секций и оба навершия ленты.
Поэтому симметрия по обеим осям обязательна — файл ставится и сверху, и снизу.

```
A Kazakh oyu-ornek rosette rendered as a cut-felt appliqué medallion (qiyq oyu
/ syrmaq) from a Central Asian steppe nomad textile, drawn as a flat pure
black (#000000) silhouette on a pure white (#FFFFFF) background.

Square, 1:1, the motif centred with clear white margin on all four sides.
Four-fold symmetry: the design is identical when mirrored about the vertical
axis and about the horizontal axis, arranged as a folded paper cut-out.

The forms are ram's-horn elements arranged around the centre: each is a short
stem splitting into two symmetric arms, each arm sweeping outward and hooking
back through about 200 degrees and ending in a BLUNT ROUNDED CLUB. Arms never
coil more than once and never taper to a point. Ribbons are thick and of
near-constant width, about one tenth of the medallion's diameter, and the
white gaps between ribbons are the same width as the ribbons.

No Celtic knotwork, no triskelion, no Archimedean coils, no concentric rings,
no Art Nouveau whiplash, no paisley, no Arabic arabesque, no Chinese cloud
scroll, no acanthus, no mandala, no flowers, no leaves, no calligraphy, no
text, no letters, no frame, no border box, no watermark, no shading, no
gradient, no grey — pure black on pure white only.
```

## 11. `oyu-rule.png` — горизонтальная линейка

Стоит под именами хозяев торжества.

```
A Kazakh oyu-ornek divider rendered as a cut-felt appliqué motif (qiyq oyu /
syrmaq) from a Central Asian steppe nomad textile, drawn as a flat pure black
(#000000) silhouette on a pure white (#FFFFFF) background.

Wide and short, aspect ratio 8:1. A single horizontal band: one central motif
with a straight thick rule running out of it to the left and to the right,
each rule ending in a small blunt rounded terminal. Strict bilateral mirror
symmetry about the vertical centre axis, arranged as a folded paper cut-out.

The central motif is a ram's-horn element: a short stem splitting into two
symmetric arms, each sweeping outward and hooking back through about 200
degrees and ending in a BLUNT ROUNDED CLUB. Arms never coil more than once and
never taper to a point. Ribbons are thick and of near-constant width and the
white gaps between them are the same width as the ribbons.

No Celtic knotwork, no triskelion, no Archimedean coils, no concentric rings,
no Art Nouveau whiplash, no paisley, no Arabic arabesque, no Chinese cloud
scroll, no acanthus, no mandala, no flowers, no leaves, no calligraphy, no
text, no letters, no frame, no border box, no watermark, no shading, no
gradient, no grey — pure black on pure white only.
```
