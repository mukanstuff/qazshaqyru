# Visual audit BEFORE — 2026-07-21 UI polish

Скрины: `*-before.png` в этой папке. Цель: surgical polish, не redesign.

## Editor (live + guided overlay)

**Хорошо:** glass topbar/side rails; preview-first center; burgundy primary «Жариялау/Готово»; bottom nav = 1 primary + 2 tabs (не 4 одинаковых).

**Бесит:**
1. HIGH — shell `#f7f1ea` + glass tint `#c4a098` + rose blobs → «розовый кабинет», не ivory studio.
2. HIGH — guided modal поверх: warm cream slab; Next Error toast перекрывает secondary CTA на mobile.
3. MED — desktop IA близко к toi split (steps | preview | inspector); Save/Preview/Publish все pill-рядом → primary не один за секунду для тёти.
4. MED — mobile bottom nav glass soft с gold/rose tint; sticky высота + ctx bar конкурируют.

**Fix:** убрать rose из `--le-glass-*` и atmosphere; bg → cream/ivory; glass = site `--us-glass-*`; topbar: Save/Preview ghost, один filled Publish; soft warm hubs без 6–14% warm-accent wash.

## Templates

**Хорошо:** preview-dominant cards; clear «сделать таким» CTA; filter chips hit ≥44px.

**Бесит:**
1. MED — hero soft pink/lilac glow; cards solid white, мало glass.
2. MED — dual CTA (preview + start) ок, но overlay «превью» chip шумит на фото.
3. LOW — modal backdrop accent-strong ок; close icon-only на desktop мелко для 45–60.

**Fix:** card footer glass-soft; filter active = accent filled (keep); modal close min 44px + glass chrome; не трогать hero composition.

## Pricing

**Хорошо:** freemium ladder понятен; «Популярный» выделен.

**Бесит:**
1. HIGH — CTA на тёмной popular-карте: тёмный текст на burgundy → нечитаемо.
2. MED — solid slabs, не glass; recommended = полный invert (toi-ish) → лучше outline+ring+badge, светлая поверхность, тёмный primary button.

**Fix:** popular card = us-glass + accent border/ring; CTA = solid white-on-accent или accent-on-ivory; остальные outline.

## Landing chrome

**Хорошо:** glass nav; brand CTA; composition нравится основателю.

**Бесит:** LOW — ornament rose fade (brand, leave).

**Fix:** не трогать hero composition.

## Dashboard / Login

**Хорошо:** primary «+ Создать» очевиден; row density приемлема.

**Бесит:**
1. MED — Agency + ops strip + empty CTA = три конкурирующих блока; ops strip можно glass-soft.
2. LOW — dashboard cards solid ivory, не glass.

**Fix:** ops strip → us-glass-soft; Agency card border accent без pink wash; login focus ring already ok — check only.

## AFTER (2026-07-21)

### Wins
- Editor shell: `--le-bg` → ivory; glass → `--us-glass-*`; rose `#c4a098` mixes removed (served CSS verified).
- Mobile: soft Publish until 100% ready; bottom «Следующее поле» = единственный filled CTA.
- Desktop topbar: Save/Preview ghost; Publish louder when ready.
- Pricing: popular card light + glass + readable primary CTA (was dark-on-dark).
- Templates: quieter overlay chip, glass footer, primary «сделать таким», modal close ≥44px.
- Hubs (EditorLayout/Invite/GuestOps/PostPublish): ivory, no warm-accent wash.

### Conscious leave
- Landing hero ornament / composition.
- Guest invitation visuals inside preview.
- Templates hero pink glow (marketing atmosphere, LOW).
- Restaurant portal warm mix (out of editor/marketing chrome scope).
- 3-column editor IA skeleton (anti-toi via color/CTA, not full relayout).

### Residual
- Next.js «1 error» toast can overlap guided CTA (dev overlay, not product chrome).
- Step rail: completed+active can tint Names while Photo is next (LOW).
- Glass on dense ivory still reads milky on some monitors — intentional for contrast.

