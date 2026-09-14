# «Мерей» — промпты (шаг 3)

Мерейтой, светлый регистр: слоновая кость, бордо, античное золото. Слаг `merei`.
План и список ассетов — `merei-plan.md`.

Семь генераций. Рваный край берётся у «Ақ мөр», фон-бумага у «Жұпар», постеры
режутся из роликов.

Что учтено из прошлых шаблонов:

- **вырезанное (`cut-`) снимается на чистом чёрном**: конвейер делает чёрное
  прозрачным и сохраняет цвет предмета;
- **орнамент в тиснении описан единицей қошқар мүйіз** — пара рогов от общего
  стебля — с запретом вертушки и одиночных крючков, и с образцом. «Сохрани
  аутентичный вид» не работает;
- **бумагу не называть «cotton rag» и не писать «stains»** — на этих словах
  фильтр генератора блокировал запрос на «Жұпар»;
- **в ролике ничего не идёт и не ломается**: камера неподвижна, движется только
  среда, пустое поле под цифру задано долей кадра;
- **у конверта нет печати**: шесть из шести рисовали вторую. Ткань и лента —
  мягкие, их модель не удваивает, но всё равно сказано «одна лента, один бант»;
- **на столе запрещены карточки и надписи**: буквы генератора — тарабарщина.

---

## 1. `cut-gold-leaf` — хлопья сусального золота, 3:2

Режется на `cut-leaf-a` и `cut-leaf-b`.

```
Macro photograph of five loose flakes of genuine gold leaf lying on a pure
matte black background, shot straight down from above. The flakes are thin,
irregular and crinkled, with torn feathery edges, of clearly different sizes
from large to small, and they are spread out with wide black space between
them so that no flake touches or overlaps another. Warm metallic gold with
soft highlights. Bright even light from above, no shadows cast on the
background, the background completely black and flat. No other objects, no
dust, no text, no watermark, no border. Horizontal 3:2 composition.
```

## 2. `hero.mp4` — первый экран

```
Five seconds, vertical 9:16, no audio. Locked-off camera, no zoom, no pan, no
push-in, no tilt, no handheld drift.

Photorealistic, luxurious and calm. Soft ivory silk fabric fills the whole
frame: gentle flowing folds rise from the bottom of the frame and fall in from
the two upper corners, catching warm golden light. Delicate flakes of genuine
gold leaf drift slowly down through the frame, a few at a time, turning softly
as they fall, and some rest on the folds of silk at the bottom.

The band between about 25% and 60% of the frame height, in the centre, is
smooth, calm, lightly lit ivory silk with no folds and no flakes resting in it,
so large text can sit there. Only a single flake occasionally drifts through
it.

The silk barely stirs; only the gold leaf moves. Bright, high-key, warm ivory
and gold, luminous, elegant. The first and last frames should look nearly
identical so the clip repeats without a visible jump.

No people, no hands, no faces. No text, no letters, no numbers, no logo, no
watermark, no border. Not dark, not dramatic, not a black background.
```

## 3. `story-emboss` — тиснение ою, 3:4

Подложка приветствия с текстом поверх — центр листа гладкий. **Если генератор
принимает картинку, приложить принятый медальон «Тақия»**
(`apps/web/public/assets/templates/taqiya/_src/oyu-medallion.jpg`) — без картинки
убрать первое предложение второго абзаца.

```
Photograph of a sheet of thick ivory watercolour paper, shot straight down,
filling the whole frame. Around all four edges of the sheet runs a wide border
of Kazakh oyu-ornek ornament that is blind-embossed into the paper: pressed as
raised relief only, with no ink, no foil and no colour at all, visible purely
through light and shadow. The whole centre of the sheet, about 70% of it, is
smooth plain paper with nothing on it.

The ornament follows the style of the attached reference image. Its building
block is the qoshqar muyiz ram's horn: a short stem that splits into two thick
horns curling away from each other into spirals, repeated evenly along the
border, with small rhombuses between the units. Rounded fleshy curves, not a
pinwheel, not single hooks, not Celtic interlace, no leaves, no lilies.

Soft low raking light from the upper left so the relief reads clearly with
gentle shadows. Warm ivory, very light, high-key. No text, no letters, no
watermark, no frame line printed on the paper. Vertical 3:4.
```

## 4. `story-hands` — руки старшего поколения, 3:4

```
Photorealistic vertical photograph, 3:4. The hands of an elderly Kazakh woman,
with soft wrinkled skin, hold a small white porcelain kese tea bowl with a thin
gold rim at the centre of the frame, one hand under the bowl and one hand
lightly around it. On her wrist is a wide silver Kazakh bracelet (bilezik)
engraved with ornament. The sleeves of a deep wine-red velvet camisole enter
from the lower edge. The hands, the bowl and the bracelet are sharp; everything
around them is soft ivory silk falling out of focus.

Bright studio, large diffused softbox, light soft and wrapping, shadows almost
absent, highlights running up into white. Palette ivory, deep wine red, silver,
warm gold. 85mm, shallow depth of field. Natural hands with five fingers each,
relaxed and anatomically correct.

No face, no head, no body above the chest. No rings on every finger, no nail
polish. No studio equipment, no softbox, no light stand, no reflector, no
tripod visible anywhere in frame. No text, no watermark, no border. Not
CGI-looking.
```

## 5. `story-keste` — вышивка кесте, 3:2

Полоса во всю ширину — узор идёт через середину, края кадра обрежутся.

```
Photorealistic horizontal close-up photograph, 3:2. Deep wine-red velvet from
a Kazakh woman's camisole fills the whole frame, with a wide band of dense
gold-thread keste embroidery running horizontally across the middle of the
frame from edge to edge. The embroidery is Kazakh oyu-ornek: repeated qoshqar
muyiz ram's horn units, each a short stem splitting into two thick horns
curling apart into spirals, stitched in raised gold thread with small gold
beads along the edges of the band. The rich velvet pile is visible above and
below the band.

Soft even light from the front, the gold thread catching warm highlights, the
velvet a rich but not black wine red. Sharp focus across the whole band.

No person, no body, no buttons, no text, no letters, no watermark, no border.
Not CGI-looking.
```

## 6. `story-hall` — банкетный стол, 3:4

Подпись поверх — верхняя треть светлая и спокойная.

```
Photorealistic vertical photograph, 3:4. A long banquet table in a modern city
restaurant in daylight, seen from standing height at one end so the table runs
away from the camera into soft focus. A crisp white tablecloth with a narrow
deep wine-red velvet runner down its centre, gold charger plates with white
porcelain plates on them, gold cutlery, clear crystal glasses, low
arrangements of white and blush roses along the runner. The table and its
settings fill the lower two thirds of the frame. The upper third is a bright,
softly out-of-focus background of tall windows with sheer white curtains and
daylight, calm and light with no detail in it.

Bright, high-key, soft natural daylight. Palette white, ivory, wine red, warm
gold. Elegant and restrained.

No people, no hands, no faces. No menu cards, no place cards, no printed
napkins, no writing of any kind, no logos. No lit candles, no evening light,
no dark interior. No studio equipment visible. No text, no watermark, no
border.
```

## 7. `envelope.mp4` — конверт с лентой

Поля сверху и снизу оставлены: владелец сказал, что под надписи они удобны.

```
Four seconds, vertical 9:16, no audio. Locked-off camera, no zoom, no pan, no
push-in, no tilt, no handheld drift.

Photorealistic. A closed envelope of thick textured paper in deep wine red
lies flat and is photographed straight on from above, centred, spanning the
full width of the frame, with plain soft light warm-ivory background above and
below it. Its pointed back flap faces the camera. Exactly one gold satin ribbon
is wrapped once around the envelope from top to bottom and tied in exactly one
small neat bow at the centre. There is no seal, no wax, no sticker and no
string anywhere.

For the first half second nothing moves. Then the bow slowly unties itself,
and the single ribbon loosens and slides smoothly off the side of the envelope
and out of the frame. Then the flap slowly lifts open upward and folds back,
revealing the pale ivory inside of the envelope. Nothing comes out. There is
only ever one ribbon in the frame.

Soft, bright, even light, shadows almost absent, fine paper grain visible.

No hands, no fingers, no people, no table, no seal, no text, no letters, no
logo, no watermark, no border.
```

## Статус ассетов

| Файл | Статус |
|---|---|
| все семь | ждут генерации |
