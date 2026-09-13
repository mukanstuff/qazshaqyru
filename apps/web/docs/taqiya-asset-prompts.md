# «Тақия» — промпты

Сүндет той, светлый регистр: бледно-голубая бумага, чернила глубокий флотский
синий, акцент золото. Слуг `taqiya`.

**Десять генераций.** Постеры не генерируются отдельно: `hero-poster.webp` и
`envelope-poster.webp` вырезаются первым кадром из самих роликов, так кадр под
видео совпадает с роликом до пикселя.

Класть в `apps/web/public/assets/templates/taqiya/_src/`, имя любое — разберу.
Формулы взяты из `template-playbook.md` §«Промпты, которые сработали»: орнамент
«Сәукеле» сел 4 из 4 с первого раза, герой — с третьего.

## Две поправки к утверждённому списку

**Тақия и шапан — не на ткани, а в руках и на ребёнке.** В списке было
«тақия на сложенной ткани» и «шапан разложен». Это ровно то, что владелец
назвал hollow на первом сәукеле: предмет костюма без тела выглядит пустым.
Поэтому тақия в руках взрослого, шапан надет на мальчика, голова за верхним
краем кадра.

**Герой — два варианта, рекомендую Б.** Уточнение владельца 2026-09-13 снимает
запрет на коня. Для сүндет той конь не декорация, а сам обряд — мальчика
сажают на коня, атқа мінгізу. У toi он на нескольких из двенадцати карточек
категории. Вариант А оставлен таким, как утверждён.

---

## 1. `oyu-medallion` — медальон, 1:1

Работает четыре раза: герой, приветствие, за календарём (крутится), финал.

```
Kazakh oyu-ornek (ою-өрнек) ornament, a single circular medallion, traditional
Kazakh felt-applique motif. Pure black silhouette on a pure white background,
flat line art, no gradients, no shading, no colour, no texture. Four pairs of
qoshqar muyiz ram's horn scrolls curling outward from a small central rhombus,
in strict four-fold mirror symmetry, enclosed by a thin ring of evenly spaced
round dots. Rounded fleshy curves, not thin Celtic interlace, and nothing
weaves over or under anything else. Generous white space between the scrolls.
Absolutely no border, no frame, no outer rectangle, no signature, no text,
no watermark. Square 1:1 composition, the medallion centred with a wide white
margin on all sides.
```

## 2. `oyu-band` — бордюр в один ряд, 6:1

```
Kazakh oyu-ornek (ою-өрнек) ornament, a horizontal border band made of ONE
single row of repeating motifs, traditional Kazakh felt-applique motif. Pure
black silhouette on a pure white background, flat line art, no gradients, no
shading, no colour, no texture. Each repeat is a pair of qoshqar muyiz ram's
horn scrolls facing each other around a small upright rhombus, the repeats
joined edge to edge so the band can continue in both directions. Rounded
fleshy curves, not thin Celtic interlace, and nothing weaves over or under
anything else. Exactly one row — not two rows, not mirrored top and bottom.
Wide white space above and below the band. Absolutely no border, no frame, no
outer rectangle, no signature, no text, no watermark. Very wide 6:1 landscape
composition.
```

Генератор без «exactly one row» отдаёт полосу в два ряда — так пришла полоса
«Сәукеле», её пришлось резать по профилю прозрачности.

## 3. `oyu-corner` — угол, 1:1

```
Kazakh oyu-ornek (ою-өрнек) ornament, a corner piece for the top left corner
of a page, traditional Kazakh felt-applique motif. Pure black silhouette on a
pure white background, flat line art, no gradients, no shading, no colour, no
texture. Qoshqar muyiz ram's horn scrolls grow along the top edge and down the
left edge from a denser cluster in the very corner, thinning and ending in
small curls as they move away from it. Rounded fleshy curves, not thin Celtic
interlace, and nothing weaves over or under anything else. The bottom right
two thirds of the square is completely empty white. Absolutely no border, no
frame, no outer rectangle, no signature, no text, no watermark. Square 1:1
composition.
```

## 4. `oyu-arrow` — разделитель, 5:1

Мужской регистр вместо цветочной филиграни «Сәукеле».

```
Kazakh oyu-ornek (ою-өрнек) ornament, a small horizontal divider, traditional
Kazakh felt-applique motif. Pure black silhouette on a pure white background,
flat line art, no gradients, no shading, no colour, no texture. In the centre
a tumar amulet shape — an upright rhombus with a small triangle above and
below — flanked left and right by short arrowhead points, then one pair of
small qoshqar muyiz ram's horn scrolls on each side that taper out to thin
curls. Strict left-right mirror symmetry. Rounded fleshy curves, not thin
Celtic interlace, and nothing weaves over or under anything else. One single
row only. Absolutely no border, no frame, no outer rectangle, no signature,
no text, no watermark. Wide 5:1 landscape composition with white space at
both ends.
```

---

## 5. `hero.mp4` — вариант Б, мальчик на коне (рекомендую)

```
Five seconds, vertical 9:16, no audio. Locked-off camera, no zoom, no pan, no
push-in, no tilt, no handheld drift.

A delicate watercolour and gouache illustration with fine gold linework, in the
style of a painted luxury Kazakh celebration invitation. A boy of about seven
sits upright on a calm white horse, both seen entirely from behind and slightly
to one side, so the boy's face is never visible. He wears a deep navy velvet
shapan with wide gold braid at the hem and cuffs, and a white domed Kazakh
takiya with gold embroidery and a small tuft of white owl feathers at the
crown. The horse wears a navy saddle cloth embroidered with gold oyu-ornek, a
gold-trimmed bridle, and thin pale blue ribbons braided into its mane. Boy and
horse occupy the lower third of the frame.

Behind them, far away and pale, the snow-capped peaks of the Alatau mountains
in soft powder-blue watercolour. The upper two thirds of the frame is a soft
painted sky of ivory and the palest blue, with branches of white apricot
blossom entering from the two top corners and fine gold Kazakh oyu-ornek
scrollwork painted into both upper corners. Across the middle of the upper half,
between the branches and the mountains, the sky is open and calm with nothing
in it.

Pale blossom petals drift slowly down through the frame; the ribbons in the
mane and the horse's tail stir gently; nothing else moves. Bright, high-key,
luminous, elegant and ceremonial. The first and last frames should look nearly
identical so the clip repeats without a visible jump.

Not a cartoon, not 3D, not a children's book style. No faces. No dusty or bare
brown steppe, no village, no plain everyday clothing, no fence, no crowd. No
text, no letters, no logo, no watermark, no border.
```

Почему так. Лицо убрано построением — со спины, запрет «no face» у Veo не
держится. Мир вокруг есть, но «вип»: белый конь в золоте, Алатау, цветение, а
не голая степь. Пустая полоса неба в верхней половине заложена в промпт прямо
— в неё встанут надзаголовок, имя и дата, это урок «Сәукеле», где текст
сначала стоял на платье.

## 5А. `hero.mp4` — вариант А, как утверждено

```
Five seconds, vertical 9:16, no audio. Locked-off camera, no zoom, no pan, no
push-in, no tilt, no handheld drift.

A delicate watercolour and gouache illustration with fine gold linework, in the
style of a painted luxury Kazakh celebration invitation. A boy of about seven
walks slowly away from the viewer toward a tall draped archway; he is seen
entirely from behind, so his face is never visible. He wears a deep navy velvet
shapan with wide gold braid at the hem and cuffs, and a white domed Kazakh
takiya with gold embroidery and a small tuft of white owl feathers at the
crown. He occupies the lower left third of the frame. The archway is hung with
ivory drapery, white blossom and navy-and-gold ribbons.

The upper two thirds of the frame is a soft painted sky of ivory and the
palest blue, crossed by branches of white apricot blossom entering from the
top corners, with fine gold Kazakh oyu-ornek scrollwork painted into both upper
corners. Across the middle of the upper half the sky is open and calm with
nothing in it.

Pale blossom petals drift slowly down through the whole frame, and the drapery
and ribbons stir gently; nothing else moves. Bright, high-key, luminous. The
first and last frames should look nearly identical so the clip repeats without
a visible jump.

Not a cartoon, not 3D. No faces. No text, no letters, no logo, no watermark,
no border.
```

---

## 6. `hero-taqiya` — тақия в руках, 3:4

Секция предмета, маска арки. Нижняя треть пойдёт под подпись поверх фото.

```
Photorealistic vertical photograph, 3:4. Two adult hands, in the sleeves of a
deep navy velvet shapan with gold braid at the cuffs, hold up a boy's Kazakh
takiya toward the camera at chest height. The takiya is a rounded dome, not a
square Uzbek tubeteika: white velvet densely embroidered in gold thread with
qoshqar muyiz ram's horn scrolls, a gold braided rim, and a small upright tuft
of white owl feathers (uki) at the crown. The takiya is sharp and fills the
upper half of the frame; the hands and sleeves are in the middle; the lower
third is soft out-of-focus ivory and pale blue silk with nothing detailed in it.

Bright studio, large diffused softbox, light soft and wrapping, shadows almost
absent, highlights running up into white. Palette ivory, powder blue, deep
navy and warm gold. 85mm, shallow depth of field.

No face, no head, no body above the shoulders in frame. No studio equipment, no
softbox, no light stand, no reflector, no mannequin stand, no tripod visible
anywhere in frame. No text, no logo, no watermark, no border. Not CGI-looking.
```

## 7. `story-shapan` — шапан на мальчике, 3:4

Той иелері, маска овала — держать предмет в центре, края срежутся.

```
Photorealistic vertical photograph, 3:4. A boy of about seven stands facing the
camera, framed from the shoulders down to the knees; his head is entirely
outside the top edge of the frame. He wears a deep navy velvet shapan with wide
gold braid along the front edges, hem and cuffs, gold oyu-ornek embroidery on
the chest, over a white shirt, closed with a gold-embroidered belt. His small
hands rest at his sides. Centred in the frame, with soft plain ivory and
powder-blue background around him.

Bright studio, large diffused softbox, light soft and wrapping, shadows almost
absent, highlights running up into white. Palette ivory, powder blue, deep
navy and warm gold. 85mm.

No face, no head, no chin in frame. No studio equipment, no softbox, no light
stand, no reflector, no mannequin stand, no tripod visible anywhere in frame.
No text, no logo, no watermark, no border. Not CGI-looking.
```

## 8. `story-dastarkhan` — ақ дастархан сверху, 3:2

Полоса во всю ширину с подписью поверх — верхняя треть под текст.

```
Photorealistic horizontal photograph, 3:2, shot straight down from above. A
festive Kazakh dastarkhan on a crisp white tablecloth: fine white porcelain
bowls with thin gold rims holding golden baursak, white kurt, dried apricots
and raisins; a crystal dish of sweets in gold wrappers; a scattering of shashu
— small gold coins and wrapped sweets — across the cloth; a narrow runner of
navy velvet embroidered with gold oyu-ornek along one edge. Everything is
arranged in the lower two thirds of the frame. The upper third is plain white
tablecloth with nothing on it.

Bright, high-key, soft even daylight, shadows almost absent, highlights running
up into white. Palette white, ivory, warm gold, deep navy, touches of apricot.
Elegant and restrained, a luxury restaurant setting, not a home kitchen.

No people, no hands, no faces. No plastic, no paper napkins, no clutter. No
studio equipment visible. No text, no logo, no watermark, no border.
```

## 9. `ground-linen` — фон, 1:1

```
Macro photograph of pale powder-blue linen fabric, shot straight down, filling
the frame edge to edge. Fine, even weave. Flat, completely even diffused light
across the whole frame. No folds, no creases, no seams, no stitching, no
vignette, no shadows, no gradient from one side to the other, very low
contrast. Square 1:1. No text, no watermark, no border.
```

При сборке тайл зеркалится по вертикали и контраст опускается к σ≈3 — иначе
швы и повтор, как было на шёлке «Сәукеле».

---

## 10. `envelope.mp4` — конверт с золотой печатью

```
Four seconds, vertical 9:16, no audio. Locked-off camera, no zoom, no pan, no
push-in, no tilt, no handheld drift.

Photorealistic. A closed square envelope of thick textured paper in pale
powder blue, photographed straight on from the front so it fills the whole
frame edge to edge; its pointed back flap faces the camera. At the centre where
the flap meets the body sits a round wax seal in warm gold, stamped with a
Kazakh qoshqar muyiz ram's horn ornament. For the first half second nothing
moves. Then the seal cracks cleanly in two, and the flap slowly lifts open
upward and away from the camera, revealing only the pale inside of the
envelope. Nothing comes out of it.

Soft, bright, even light, shadows almost absent, fine paper grain visible.

No hands, no fingers, no people, no table edge, no background visible around
the envelope. No text, no letters, no logo, no watermark, no border.
```

Пережимать с `-crf 24 -b:v 0`, не «поменьше»: первый конверт «Сәукеле» в 86 КБ
владелец назвал низким фпс.
