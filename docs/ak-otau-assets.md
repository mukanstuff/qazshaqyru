# Ассеты для шаблона «Ақ отау» — бриф на генерацию

Куда класть: `apps/web/public/assets/templates/ak-otau/`
Имя файла обязано совпадать буква в букву — код ссылается на них напрямую.

Промпты на английском намеренно: флагманские модели заметно точнее держат
композицию и свет по-английски. Просто копируйте целиком.

---

## Правила, которые важнее самих промптов

1. **Пара — всегда со спины или без лица в кадре.** Это не трусость перед моделью,
   это то, что делают оба эталона (shaqyru24 №2, №7, №8, toi template25/29). Лицо
   в кадре мгновенно превращает «шаблон» в «чужую свадьбу», а гость должен
   примерить его на себя. Плюс так не бывает пластиковых AI-лиц.
2. **Верхняя треть кадра — пустая.** Там ляжет имя. Если модель забила небо
   деталями, кадр не годится, даже если красивый.
3. **Никакого текста на картинке.** Модели любят дописать кривую надпись
   «Wedding». В промптах стоит запрет, но проверяйте глазами.
4. **Орнаменты — строго чёрное на белом.** Не золотое, не с тенью, не с
   градиентом. Я программно вырезаю фон и перекрашиваю их в цвет темы; если
   придёт золотой градиент, вырезание даст грязь по краям.
5. Если кадр «почти», но с дефектом — перегенерируйте, не правьте. Дешевле.

---

## 1. `hero.webp` — главный кадр

Соотношение сторон: **9:16** (вертикальный).

```
Editorial wedding photograph, vertical 9:16 format. A young Kazakh couple stands
on open steppe at golden hour, seen from behind, holding hands, facing a low
distant horizon. She wears an ivory and pale-gold traditional Kazakh wedding
dress with fine silver jewellery and a saukele headdress with a long light veil
lifting in the wind. He wears a fitted deep charcoal chapan with restrained gold
embroidery at the cuffs and collar. Low warm sun behind them, long soft shadows,
dry feather grass catching rim light, distant blue-grey hills, high haze.
Shot on 85mm at f/2, shallow depth of field, natural light only, fine film
grain. Muted warm palette: ivory, wheat gold, dusty sage, pale sky. The upper
third of the frame is calm empty sky with a soft gradient and no detail.
Photorealistic. No text, no lettering, no watermark, no logo. Faces not visible.
```

Брак, если: видно лица; небо забито облаками; платье белое «европейское» без
казахских деталей; саукеле похоже на кокошник.

---

## 2. `closing.webp` — финальный кадр

Соотношение сторон: **9:16**.

```
Editorial wedding photograph, vertical 9:16 format. The same Kazakh couple seen
from far behind, small in the frame, walking away together across wide open
steppe at late dusk. Deep sky occupying the top two thirds, first stars barely
visible, a thin warm band of afterglow on the horizon. Silhouetted feather grass
in the foreground, slightly out of focus. Cool blue and deep indigo tones with a
single warm amber accent at the horizon. Shot on 50mm at f/2.8, natural light,
fine film grain, calm and quiet mood. Wide empty sky with no detail in the upper
half. Photorealistic. No text, no lettering, no watermark, no logo.
```

---

## 3–5. `story-1.webp`, `story-2.webp`, `story-3.webp` — галерея «Біздің тарих»

Соотношение сторон у всех трёх: **3:4** (вертикальный).
Это набор — они должны выглядеть снятыми в один день одним человеком.

### `story-1.webp` — руки

```
Intimate detail photograph, vertical 3:4. Close-up of a couple's hands resting
together on ivory linen: her hand over his, a slim polished gold wedding band on
her finger. Her sleeve is ivory silk with fine tone-on-tone Kazakh embroidery at
the cuff; his is charcoal wool. Soft directional window light from the left,
gentle falloff into shadow on the right. Shot on 100mm macro at f/2.8, very
shallow depth of field. Warm neutral palette, ivory and gold, no strong colour.
Photorealistic, fine film grain. No text, no watermark, no faces.
```

### `story-2.webp` — дастархан

```
Still life photograph, vertical 3:4. A Kazakh wedding dastarkhan detail: golden
baursak piled in a shallow unglazed ceramic bowl, dried apricots and walnuts
scattered nearby, two porcelain kese tea bowls with a thin gold rim, a folded
textile with a subtle woven ram's-horn ornament at the edge of frame. Warm
afternoon light raking from the side, soft shadows, dark walnut table surface.
Shot on 50mm at f/2.8, shallow depth of field. Palette of amber, cream, warm
brown, one muted crimson accent in the textile. Photorealistic, fine film grain.
No text, no watermark, no people.
```

### `story-3.webp` — домбра

```
Still life photograph, vertical 3:4. An old dombra resting against a whitewashed
wall beside a folded felt textile with muted crimson and cream Kazakh ornament.
Warm late-afternoon sunlight falls across the instrument's worn wooden body,
strong side light, deep quiet shadow behind. Shot on 50mm at f/2, shallow depth
of field. Palette of aged wood, cream, dusty crimson. Calm, restrained,
documentary mood. Photorealistic, fine film grain. No text, no watermark,
no people.
```

---

## 6. `oyu-hero.png` — крупный орнамент поверх фото

Соотношение сторон: **1:1** (квадрат).

```
Flat vector ornament. Pure white background. Solid pure black shapes only.
A single large traditional Kazakh qoshqar muiz (ram's horn) ornament medallion:
symmetrical, built from paired spirals and hooked curls in the authentic Kazakh
oyu vocabulary. Bold confident strokes of even weight, closed composition,
crisp clean edges. Absolutely no gradients, no shading, no 3D, no drop shadow,
no outline of varying width, no grey tones — only pure black and pure white.
Centred, filling about 85 percent of the square frame. No text, no letters,
no watermark, no background texture.
```

Брак, если: серые полутона, тень, объём, любые оттенки кроме чёрного и белого.

---

## 7. `oyu-medallion.png` — вращающийся медальон

Соотношение сторон: **1:1**.

```
Flat vector ornament. Pure white background. Solid pure black shapes only.
A circular Kazakh oyu rosette: a perfect circle formed by a ram's-horn
(qoshqar muiz) motif repeated and rotated eight times around the centre, with a
solid concentric ring border and a small solid centre. Radially symmetrical.
Even stroke weight, crisp clean edges. Absolutely no gradients, no shading,
no 3D, no drop shadow, no grey tones — only pure black and pure white.
Fills about 90 percent of the square frame. No text, no letters, no watermark.
```

Этот вращается на странице, поэтому он обязан быть **радиально симметричным** —
иначе вращение будет заметно «дёргаться».

---

## 8. `oyu-divider.png` — горизонтальная полоса-разделитель

Соотношение сторон: **16:9** или шире, если модель позволяет (нужна широкая
короткая полоса — я всё равно обрежу пустое).

```
Flat vector ornament. Pure white background. Solid pure black shapes only.
A horizontal Kazakh oyu border band: a ram's-horn motif repeated in a row and
mirrored along a central horizontal axis, with small solid diamonds separating
the repeats, tapering to a point at both ends. The band is wide and short,
sitting as a single thin strip across the middle of the frame with empty white
above and below. Even stroke weight, crisp clean edges. No gradients, no
shading, no 3D, no grey tones. No text, no letters, no watermark.
```

---

## 9. `paper.webp` — фактура бумаги (необязательный, но заметный)

Соотношение сторон: **1:1**.

```
A flat overhead scan of warm ivory handmade cotton paper. Subtle irregular
fibre texture, very faint deckled tonal variation, no visible edges, no objects,
no shadows, evenly lit, almost uniform. Extremely low contrast — the texture
should be barely perceptible, closer to a clean surface than to a rough one.
Colour is warm ivory, slightly creamy. No text, no watermark, no pattern.
```

---

## Что делать после генерации

Сложите всё в `apps/web/public/assets/templates/ak-otau/` и скажите мне.
Дальше я сам: обрежу, сконвертирую в webp, вырежу фон у трёх орнаментов и
перекрашу их в цвет темы, соберу шаблон и покажу вживую.
