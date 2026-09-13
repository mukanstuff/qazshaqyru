# «Жұпар» — промпты

Үйлену тойы, светлый регистр: слоновая кость, эвкалиптово-зелёный, приглушённое
золото, чернила тёмно-оливковые. Слаг `zhupar`.

**Девять генераций.** Постеры `hero-poster` и `envelope-poster` вырезаются первым
кадром из роликов. Четыре иконки программы генерируются одним листом и режутся.

Класть в `apps/web/public/assets/templates/zhupar/_src/`, имя любое — разберу.

Что учтено из прошлых шаблонов, чтобы не платить второй раз:

- орнамент описан через единицу қошқар мүйіз — пара рогов от общего стебля,
  голова барана анфас — с запретом вертушки, одиночных крючков, лилий и стрел,
  и с принятым медальоном «Тақия» как образцом. Первый заход с фразой «каждый
  рог кончается спиралью» дал два дубля мимо, разбор ниже в разделе
  «Орнамент, второй заход». Приписка «сохрани аутентичный вид» не работала ни
  разу, поэтому её нет;
- пара в ролике **стоит**, а не идёт. У «Тақия» мальчик шёл к арке, и на стыке
  петли он прыгал обратно к краю кадра;
- пустая полоса неба под имена задана в промпте долей высоты кадра, а не словом
  «тихо»;
- у печати конверта сказано, куда уходит каждая половина и что печать одна;
- поля сверху и снизу у конверта оставлены: владелец сказал, что под надписи
  они даже удобны.

---

## Орнамент, второй заход

Первые два дубля медальона мимо, оба, и это промпт, а не случайность. Слева
пришла розетка из восьми одиночных крючков, справа — вертушка с четырьмя
закрученными лучами. Казахского в обоих нет: у қошқар мүйіз рога идут **парой**,
расходясь от общего стебля, как голова барана анфас, а не по одному.

Что сломал я сам. Промпт медальона «Тақия», который сел с первого раза,
говорил «четыре пары рогов». Я «улучшил» его: добавил «каждый рог кончается
спиралью» и «белые просветы шириной со штрих». Первая фраза отвязала спираль
от пары — отсюда крючки и вертушка. Вторая дала тонкие ровные линии вместо
мясистых форм. Рабочий промпт нельзя докручивать словами, которые не
проверены: каждое слово модель исполняет буквально.

Как теперь:

- **единица орнамента определена прямо:** короткий стебель, который
  раздваивается на два толстых рога, закрученных в разные стороны — голова
  барана анфас;
- **запрещена вертушка и одиночный крючок** — это ровно то, что пришло;
- **если генератор принимает картинку**, приложить принятый медальон «Тақия»
  (`apps/web/public/assets/templates/taqiya/_src/oyu-medallion.jpg`) и
  попросить тот же штрих. Картинка держит стиль надёжнее любого описания;
- **запасной путь:** если и второй заход мимо, ставим медальон «Тақия» в
  зелёно-золотом тинте. Форма та же, но в другом цвете и на другой странице
  повтор одного медальона не бросится в глаза.

## 1. `oyu-medallion` — медальон, 1:1

Пять ролей плюс бусины на линии программы, поэтому силуэт должен читаться и на
200 px, и на 16.

```
Kazakh oyu-ornek (ою-өрнек) ornament, a single circular medallion, traditional
Kazakh felt-applique motif, in the same style and stroke weight as the attached
reference image. Pure black silhouette on a pure white background, flat line
art, no gradients, no shading, no colour, no texture.

The building block is the qoshqar muyiz, the ram's horn: a short stem that
splits into two thick horns curling away from each other and down into
spirals, like a ram's head seen from the front. Four of these ram's horn units
point outward along the vertical and horizontal axes, their stems meeting
around a small central rhombus, and four smaller ram's horn units sit on the
diagonals between them. Strict mirror symmetry across both the vertical and the
horizontal axis. Enclosed by a thin ring of evenly spaced round dots.

Rounded fleshy curves, not thin Celtic interlace, not a pinwheel, not a swirl,
no single hooks, nothing weaves over or under anything else. Generous white
space between the units. Absolutely no border, no frame, no outer rectangle, no
signature, no text, no watermark. Square 1:1 composition, the medallion centred
with a wide white margin on all sides.
```

Без приложенной картинки убрать первую фразу про reference.

## 2. `oyu-band` — бордюр, 6:1

Нарезается по целым повторам и замащивается, поэтому ряд — желательно один, но
два сросшихся тоже переживём.

```
Kazakh oyu-ornek (ою-өрнек) ornament, a horizontal border band, traditional
Kazakh felt-applique motif, in the same style and stroke weight as the attached
reference image. Pure black silhouette on a pure white background, flat line
art, no gradients, no shading, no colour, no texture.

The band is one row of identical qoshqar muyiz ram's horn units: each unit is a
short upright stem that splits into two thick horns curling away from each
other and down into spirals, like a ram's head seen from the front. The units
stand side by side, evenly spaced, with a small rhombus between neighbours, and
the row continues off both side edges.

Rounded fleshy curves, not Celtic interlace, not a wave of single hooks, nothing
weaves over or under anything else. Exactly one row, not two rows, not mirrored
top and bottom. Wide white space above and below. Absolutely no border, no
frame, no outer rectangle, no text, no watermark. Very wide 6:1 landscape
composition.
```

## 3. `oyu-corner` — угол, 1:1

```
Kazakh oyu-ornek (ою-өрнек) ornament, a corner piece for the top left corner of
a page, traditional Kazakh felt-applique motif, in the same style and stroke
weight as the attached reference image. Pure black silhouette on a pure white
background, flat line art, no gradients, no shading, no colour, no texture.

In the very corner sits one large qoshqar muyiz ram's horn unit — a short stem
splitting into two thick horns curling away from each other into spirals — set
diagonally so it faces into the page. From it, a chain of smaller ram's horn
units runs along the top edge and down the left edge, getting smaller as it
moves away from the corner.

Rounded fleshy curves, not Celtic interlace, not a pinwheel, nothing weaves
over or under anything else. No leaves, no lilies, no fleur-de-lis, no flowers,
no cross. The bottom right two thirds of the square is completely empty white.
Absolutely no border, no frame, no outer rectangle, no text, no watermark.
Square 1:1.
```

Лилии и крест в центре пришли в первом углу «Тақия»; запрет назван прямо.

## 4. `oyu-icons` — четыре иконки одним листом, 4:1

После генерации режется на `oyu-icon-kese`, `oyu-icon-saukele`,
`oyu-icon-dombra`, `oyu-icon-tort`.

```
A set of four simple icons in one row on a pure white background, for a
Kazakh wedding programme. Pure black flat silhouettes, no gradients, no
shading, no colour, no outlines-only drawings: solid black shapes with a few
fine details left as white negative space. All four icons drawn in exactly the
same style, the same visual weight and the same height, each centred in its
own quarter of the image with wide empty white space between them so each can
be cut out separately. Nothing touches or overlaps.

From left to right:
1. A Kazakh tea bowl kese — a small wide handleless bowl on a low foot, with a
   thin band of oyu ornament around it and two soft curls of steam above.
2. A saukele — the tall cone-shaped Kazakh bridal headdress with a rounded
   crown, a small feather tuft on top, a fur-trimmed base and a light veil
   falling from its sides.
3. A dombra — a two-stringed Kazakh lute with a pear-shaped teardrop body and a
   long straight neck with frets and two tuning pegs. Not a triangular
   balalaika, not a guitar with a waist.
4. A three-tier round wedding cake with a small flower on the top tier.

No text, no labels, no numbers, no circles or frames around the icons, no
border, no watermark. Wide 4:1 landscape composition.
```

Лист, а не четыре генерации: так иконки нарисованы одной рукой. Каждая уточнена
по форме, потому что без этого домбыра приходит балалайкой, а сәукеле — колпаком.

---

## 5. `hero.mp4` — первый экран, акварель

```
Five seconds, vertical 9:16, no audio. Locked-off camera, no zoom, no pan, no
push-in, no tilt, no handheld drift.

A delicate watercolour and gouache illustration with fine gold linework, in the
style of a painted luxury Kazakh wedding invitation. A bride and groom stand
still, side by side and hand in hand, in front of a tall arch of eucalyptus
branches and white roses hung with soft ivory drapery. Both are seen entirely
from behind, so no face is ever visible. The bride wears a white gown with a
long sheer veil whose edge is embroidered with a fine gold Kazakh oyu-ornek
pattern; the groom wears a dark charcoal suit. They stand in the lower third of
the frame and do not walk.

The upper part of the frame is a soft painted sky of warm ivory and the palest
sage green, with sprigs of eucalyptus entering from the two top corners and
fine gold Kazakh oyu-ornek scrollwork painted into both upper corners. The band
between about 15% and 40% of the frame height, above the arch and below the
corner sprigs, is open, calm sky with nothing in it.

White rose petals and a few small eucalyptus leaves drift slowly down through
the frame; the veil and the drapery stir gently; the couple does not move.
Bright, high-key, luminous, elegant. The first and last frames should look
nearly identical so the clip repeats without a visible jump.

Not a cartoon, not 3D, not a children's book style. No faces. No text, no
letters, no logo, no watermark, no border.
```

## 6. `story-rings` — кольца, 3:4

Уйдёт в овал с двумя тонкими рамками — предмет строго в центре, края срежутся.

```
Photorealistic vertical photograph, 3:4. Two hands, a bride's and a groom's,
rest one on the other at the centre of the frame, each wearing a plain gold
wedding ring, laid across a single fresh sprig of eucalyptus on soft ivory silk.
The hands and the rings are sharp and fill the middle of the frame; everything
around them is soft ivory silk falling out of focus.

Bright studio, large diffused softbox, light soft and wrapping, shadows almost
absent, highlights running up into white. Palette ivory, sage green, warm gold.
85mm, shallow depth of field.

No faces, no bodies beyond the wrists. No nail polish in bright colours, no
jewellery other than the two rings. No studio equipment, no softbox, no light
stand, no reflector, no tripod visible anywhere in frame. No text, no watermark,
no border. Not CGI-looking.
```

## 7. `story-table` — стол в ресторане, 3:2

Полоса во всю ширину с подписью — верхняя треть под текст.

```
Photorealistic horizontal photograph, 3:2, shot straight down from above. A
wedding banquet table in a modern city restaurant in daylight: a crisp white
tablecloth, a loose garland of fresh eucalyptus running along the table with
small white roses tucked into it, white porcelain plates with thin gold rims,
gold cutlery, clear crystal glasses and folded ivory linen napkins. Everything
is arranged in the lower two thirds of the frame. The upper third is plain
white tablecloth with nothing on it.

Bright, high-key, soft even daylight, shadows almost absent. Palette white,
ivory, sage green, warm gold. Elegant and restrained.

No people, no hands, no faces. No menu cards, no place cards, no printed
napkins, no writing of any kind, no logos. No lit candles, no evening light. No
studio equipment visible. No text, no watermark, no border.
```

Карточки меню запрещены отдельно: на них модель пишет буквы, а буквы из
генератора — это всегда тарабарщина.

## 8. `ground-paper` — фон, 1:1

```
Macro photograph of thick ivory cotton rag paper, shot straight down, filling
the frame edge to edge. Soft, fine, even fibre. Flat, completely even diffused
light across the whole frame. No folds, no creases, no torn or deckled edges,
no stains, no vignette, no shadows, no gradient from one side to the other, very
low contrast. Square 1:1. No text, no watermark, no border.
```

Конвейер сам зеркалит тайл и опускает контраст до σ ≈ 3.

---

## 9. `envelope.mp4` — конверт

```
Four seconds, vertical 9:16, no audio. Locked-off camera, no zoom, no pan, no
push-in, no tilt, no handheld drift.

Photorealistic. A closed envelope of thick textured ivory paper lies flat and is
photographed straight on from above, centred, spanning the full width of the
frame, with plain soft light warm-grey background above and below it. Its
pointed back flap faces the camera. Exactly one round wax seal in muted sage
green sits where the flap meets the body, stamped with a flat Kazakh qoshqar
muyiz ram's horn scroll ornament, not an animal head.

For the first half second nothing moves. Then the seal splits cleanly into two
halves along a vertical line; the upper half stays on the flap and the lower
half stays on the envelope. The flap slowly lifts upward and away, revealing
the pale inside of the envelope. There is only ever one seal in the frame.
Nothing comes out.

Soft, bright, even light, shadows almost absent, fine paper grain visible.

No hands, no fingers, no people, no table, no text, no letters, no logo, no
watermark, no border.
```

## Статус ассетов

| Файл | Статус |
|---|---|
| `oyu-medallion` | **принят**, второй заход: пары рогов от общего стебля, ромб в центре, кольцо точек. Лежит в `_src` |
| `oyu-band-tile` | **не генерировать.** Вырезается из принятого медальона: одна лопасть со стеблем и ромб из центра, повтором. Нарисовано той же рукой по построению |
| `oyu-corner` | **не генерировать.** Четверть того же медальона в двух противоположных углах карточки: срез ложится на край карточки и не виден |
| `oyu-icons` | лист 1 из второго захода годится, нужен файл |
| `hero`, `story-rings`, `story-table`, `ground-paper`, `envelope` | ждут генерации |

Шесть углов и полоса из второго захода не приняты. Углы — асимметричный
завиток с листом на конце и цепочка одиночных крючков по краям, это барокко, а
не қошқар мүйіз. Полоса пришла в три ряда буквальных бараньих голов с мордой:
узнаваемо, но фольклорно для этой палитры. Генерировать дальше не стали: из
единственного удачного медальона полоса и угол получаются вырезкой, и весь
орнамент шаблона оказывается одного почерка.
