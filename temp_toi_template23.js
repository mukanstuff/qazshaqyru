const a=`<!doctype html>
<!-- V3 -->
<!-- NO_PALETTE -->
<html lang="kk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Uzatu Saukele Cream</title>
<style>
/* Fonts: Cormorant Garamond (serif body + date values, substitutes Prata),
   Asylbek Shelley (hero name script), Ceremonious (decorative "Қыз ұзату"),
   Montserrat (sans labels). Mirrors a kelshi qyz-uzatu reference: watercolor
   saukele-bride video hero, rose-frame cards, gold confetti, editorial gallery. */
@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/cormorant-normal-cyrillic-ext.woff2') format('woff2');unicode-range:U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F;}
@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/cormorant-normal-cyrillic.woff2') format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116;}
@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/cormorant-normal-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;}
@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/cormorant-normal-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
@font-face{font-family:T23Script;src:url('/fonts/asylbek-shelley.woff2') format('woff2');font-display:swap}
@font-face{font-family:T23Cer;src:url('/fonts/Ceremonious.woff2') format('woff2');font-display:swap}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --paper:#fdfbf7;
  --cream:#fcf8ef;
  --gold:#a86810;
  --brown:#623d09;
  --font-serif:'Cormorant Garamond',Georgia,serif;
  --font-script:T23Script,'Cormorant Garamond',cursive;
  --font-cer:T23Cer,'Cormorant Garamond',cursive;
  --font-sans:'Montserrat','Segoe UI',system-ui,sans-serif;
}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
body{
  width:100%;
  max-width:430px;
  min-height:100vh;
  margin:0 auto;
  background:var(--paper);
  color:var(--brown);
  font-family:var(--font-serif);
  overflow-x:hidden;
}
a{color:inherit;text-decoration:none}
button,input{font:inherit}
button{cursor:pointer}
img{display:block;max-width:100%}

.page{
  width:100%;
  min-height:100vh;
  background:var(--toi-page-bg-override,var(--paper));
  display:flex;
  flex-direction:column;
}
.reveal{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}

/* ---------- HERO (video) ---------- */
.hero{
  position:relative;
  height:590px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:flex-start;
  gap:8px;
  padding:84px 24px 60px;
  overflow:hidden;
  isolation:isolate;
  text-align:center;
  background:var(--cream);
}
.hero-video{
  position:absolute;
  inset:0;
  z-index:-2;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:50% 50%;
}
.hero::after{
  content:"";
  position:absolute;
  inset:0;
  z-index:-1;
  background:linear-gradient(179deg,rgba(252,248,239,0) 70%,var(--cream) 100%);
  pointer-events:none;
}
.hero-name{
  font-family:var(--font-script);
  font-weight:400;
  font-size:clamp(52px,18vw,64px);
  line-height:1.15;
  color:var(--gold);
}
.hero-divider{width:min(58%,200px);height:auto;opacity:.95}
.hero-sub{
  font-family:var(--font-cer);
  font-size:clamp(26px,8vw,32px);
  line-height:1;
  color:var(--gold);
}

/* ---------- framed cards ---------- */
.card{
  position:relative;
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:16px;
  padding:40px 30px;
  text-align:center;
  background:var(--paper);
  color:var(--brown);
}
.card--frame{
  min-height:760px;
  justify-content:center;
  gap:18px;
  padding:120px 54px;
  background-color:var(--cream);
  background-repeat:no-repeat;
  background-position:center;
  background-size:100% 100%;
}
.card--greeting{background-image:url('/template-assets/uzatu-template23/frame-greeting.webp')}
.card--date{background-image:url('/template-assets/uzatu-template23/frame-date.webp')}

.heading{font-family:var(--font-serif);font-weight:500;font-size:clamp(24px,7vw,28px);letter-spacing:.04em;color:var(--brown)}
.lead-text{max-width:330px;font-family:var(--font-serif);font-size:clamp(16px,4.6vw,18px);line-height:1.7;color:var(--brown);white-space:pre-line}
.divider-sm{width:min(64%,220px);height:auto;opacity:.9}
.owners-label{font-family:var(--font-serif);font-size:18px;color:var(--brown)}
.owners-name{font-family:var(--font-serif);font-weight:600;font-size:22px;color:var(--brown)}

/* ---------- countdown ---------- */
.countdown{
  position:relative;
  width:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  padding:54px 18px;
  overflow:hidden;
  isolation:isolate;
  background-color:var(--cream);
  background-image:url('/template-assets/uzatu-template23/countdown-bg.webp');
  background-repeat:no-repeat;
  background-position:center;
  background-size:100% 100%;
}
.cd-confetti{position:absolute;z-index:0;width:108px;opacity:.8;pointer-events:none}
.cd-confetti--l{top:6px;left:-18px;transform:rotate(180deg)}
.cd-confetti--r{bottom:6px;right:-18px;transform:rotate(-80deg)}
.cd-item{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;min-width:60px}
.cd-value{font-family:var(--font-serif);font-weight:600;font-size:clamp(34px,11vw,42px);line-height:1;color:var(--gold)}
.cd-label{margin-top:4px;font-family:var(--font-sans);font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--brown);opacity:.8}
.cd-sep{position:relative;z-index:1;font-family:var(--font-serif);font-size:30px;color:var(--gold);opacity:.5;align-self:flex-start;margin-top:2px}

/* ---------- date / location ---------- */
.date-eyebrow{font-family:var(--font-sans);font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--brown);opacity:.85}
.date-value{font-family:var(--font-serif);font-weight:600;font-size:clamp(28px,9vw,34px);line-height:1.1;color:var(--brown)}
.date-time{font-family:var(--font-serif);font-size:clamp(22px,7vw,26px);color:var(--gold)}
.address{max-width:84%;font-family:var(--font-serif);font-size:clamp(17px,5vw,20px);line-height:1.4;color:var(--brown);white-space:pre-line}
.map-btn{
  display:inline-flex;align-items:center;justify-content:center;min-height:48px;margin-top:6px;
  padding:0 28px;border-radius:999px;background:var(--gold);color:#fffaf0;
  font-family:var(--font-sans);font-size:14px;font-weight:700;letter-spacing:.02em;
  box-shadow:0 14px 26px -16px rgba(120,76,16,.7);transition:transform .25s ease;
}
.map-btn:hover{transform:translateY(-2px)}

/* ---------- dress code ---------- */
.dress-title{font-family:var(--font-serif);font-weight:500;font-size:clamp(26px,8vw,32px);letter-spacing:.04em;color:var(--brown)}
.dress-note{max-width:320px;font-family:var(--font-serif);font-size:17px;line-height:1.55;color:var(--brown)}
.dress-art{width:min(78%,260px);height:auto;margin-top:4px}

/* ---------- gallery ---------- */
.gallery{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}
.gallery img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:10px}

/* ---------- RSVP ---------- */
.rsvp-title{max-width:300px;font-family:var(--font-serif);font-weight:600;font-size:clamp(20px,6vw,23px);line-height:1.25;color:var(--brown);white-space:pre-line}
.rsvp-hint{font-family:var(--font-serif);font-size:16px;line-height:1.5;color:var(--brown);opacity:.82}
.rsvp-form{width:min(100%,330px);margin:0 auto}
.field{margin-top:12px;text-align:left}
.field-label{display:block;margin-bottom:6px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#9a7330;font-family:var(--font-sans)}
.name-input{width:100%;height:52px;border:1.5px solid rgba(168,104,16,.38);border-radius:999px;background:#fffaf2;padding:0 20px;color:#5a3a08;outline:none;text-align:center;font-size:16px}
.name-input::placeholder{color:#bb9a63}
.name-input:focus{border-color:var(--gold);box-shadow:0 0 0 4px rgba(168,104,16,.14)}
.radio-list{display:grid;gap:12px;margin-top:14px}
.radio-item{display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;padding:12px 18px;border:1.5px solid rgba(168,104,16,.34);border-radius:999px;background:#fffaf2;color:var(--brown);font-family:var(--font-serif);font-size:18px;font-weight:500;transition:transform .18s ease,background .18s ease,border-color .18s ease}
.radio-item:hover{transform:translateY(-1px);border-color:rgba(168,104,16,.6)}
.radio-item input{position:absolute;opacity:0;pointer-events:none}
.radio-item:has(input:checked){background:var(--gold);border-color:var(--gold);color:#fffaf0}
.guests-field{margin-top:14px;text-align:center}
.guest-count-input{width:100%;height:52px;border:1.5px solid rgba(168,104,16,.38);border-radius:999px;background:#fffaf2;padding:0 18px;color:#5a3a08;outline:none;text-align:center;font-size:18px;font-weight:600}
.guests-field.is-hidden{display:none}
.submit-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:54px;margin-top:18px;border:0;border-radius:999px;background:linear-gradient(135deg,#c08226,#8a5409);color:#fffaf0;font-family:var(--font-sans);font-size:16px;font-weight:700;letter-spacing:.02em;box-shadow:0 14px 28px -16px rgba(120,76,16,.7)}
.submit-btn:hover{transform:translateY(-1px)}
.success-msg{display:none;margin-top:18px;font-family:var(--font-cer);font-size:28px;color:var(--gold)}
#rPhone,#rAttending,#rNote{display:none}

/* ---------- final ---------- */
.final{
  position:relative;
  min-height:420px;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  padding:60px 30px 48px;
  overflow:hidden;
  isolation:isolate;
  text-align:center;
}
.final-bg{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;object-position:50% 30%}
.final::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(252,248,239,0) 40%,rgba(252,248,239,.92) 100%)}
.final-text{font-family:var(--font-cer);font-size:clamp(28px,9vw,34px);line-height:1.2;color:var(--gold)}

/* ---------- music toggle ---------- */
.music-toggle{position:absolute;top:16px;right:16px;z-index:10;width:48px;height:48px;display:inline-flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.9);border-radius:50%;background:rgba(168,104,16,.5);color:#fff;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);box-shadow:0 12px 26px -14px rgba(0,0,0,.5);transition:transform .25s ease,background .25s ease}
.music-toggle:hover{transform:scale(1.06);background:rgba(168,104,16,.75)}
.music-toggle svg{width:20px;height:20px;display:block}
.music-toggle .icon-pause{display:none}
.music-toggle[aria-pressed="true"] .icon-play{display:none}
.music-toggle[aria-pressed="true"] .icon-pause{display:block}
.music-toggle.is-hidden{display:none}

@media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}}
@media (max-width:360px){.hero{height:540px;padding-top:70px}.card--frame{min-height:640px;padding-left:42px;padding-right:42px}}
</style>
</head>
<body>

<main class="page">

  <!-- HERO -->
  <section class="hero" data-block="hero" data-edit-id="sec-1" data-edit-container>
    <button class="music-toggle music-btn" id="musicToggle" type="button" aria-pressed="false" aria-label="Музыканы қосу/өшіру">
      <svg class="icon-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
      <svg class="icon-pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>
    </button>
    <audio id="heroAudio" preload="none" loop data-bind="music"></audio>
    <video class="hero-video" poster="/template-assets/uzatu-template23/hero-poster.webp" autoplay muted loop playsinline preload="auto" aria-hidden="true">
      <source src="/template-assets/uzatu-template23/hero.webm" type="video/webm">
    </video>
    <h1 class="hero-name reveal visible" id="heroName" data-edit-id="hero-name" data-kk="Дана" data-ru="Дана">Дана</h1>
    <img class="hero-divider" src="/template-assets/uzatu-template23/divider-hero.webp" alt="" aria-hidden="true" decoding="async">
    <div class="hero-sub reveal visible" id="heroSubline" data-edit-id="hero-subline" data-kk="Қыз ұзату" data-ru="Қыз ұзату">Қыз ұзату</div>
  </section>

  <!-- GREETING -->
  <section class="card card--frame card--greeting" data-block="intro" data-edit-id="sec-2" data-edit-container>
    <div class="reveal" data-reveal style="display:flex;flex-direction:column;align-items:center;gap:16px;width:100%">
      <h2 class="heading" id="inviteTitle" data-edit-id="invite-title" data-kk="ҚҰРМЕТТІ ҚОНАҚТАР" data-ru="ДОРОГИЕ ГОСТИ">ҚҰРМЕТТІ ҚОНАҚТАР</h2>
      <p class="lead-text" id="inviteText" data-edit-id="invite-text" data-kk="Сіздерді аяулы қызымыздың ата-анасының аялы алақанынан — құтты босағасына шығарып салу рәсіміне арналған салтанатты дастарханымыздың қадірлі қонағы болуға шақырамыз!" data-ru="Приглашаем вас на торжество, посвящённое проводам нашей дочери в дом жениха!">Сіздерді аяулы қызымыздың ата-анасының аялы алақанынан — құтты босағасына шығарып салу рәсіміне арналған салтанатты дастарханымыздың қадірлі қонағы болуға шақырамыз!</p>
      <img class="divider-sm" src="/template-assets/uzatu-template23/divider-card.webp" alt="" aria-hidden="true" loading="lazy">
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div class="owners-label" id="ownersTitle" data-edit-id="owners-title" data-kk="Той иелері:" data-ru="Хозяева торжества:">Той иелері:</div>
        <div class="owners-name" id="ownersName" data-edit-id="owners-name" data-kk="Усен — Гүлнар" data-ru="Усен — Гүлнар">Усен — Гүлнар</div>
      </div>
    </div>
  </section>

  <!-- COUNTDOWN -->
  <section class="countdown" data-block="countdown" data-edit-id="sec-3" data-edit-container>
    <img class="cd-confetti cd-confetti--l" src="/template-assets/uzatu-template23/confetti1.webp" alt="" aria-hidden="true" loading="lazy">
    <img class="cd-confetti cd-confetti--r" src="/template-assets/uzatu-template23/confetti2.webp" alt="" aria-hidden="true" loading="lazy">
    <div class="cd-item"><span class="cd-value" data-bind="countdown.days">82</span><span class="cd-label" data-kk="Күн" data-ru="дней">Күн</span></div>
    <span class="cd-sep">:</span>
    <div class="cd-item"><span class="cd-value" data-bind="countdown.hours">21</span><span class="cd-label" data-kk="Сағат" data-ru="часов">Сағат</span></div>
    <span class="cd-sep">:</span>
    <div class="cd-item"><span class="cd-value" data-bind="countdown.minutes">54</span><span class="cd-label" data-kk="Минут" data-ru="минут">Минут</span></div>
    <span class="cd-sep">:</span>
    <div class="cd-item"><span class="cd-value" data-bind="countdown.seconds">15</span><span class="cd-label" data-kk="Секунд" data-ru="секунд">Секунд</span></div>
  </section>

  <!-- DATE / LOCATION -->
  <section class="card card--frame card--date" data-block="location" data-edit-id="sec-4" data-edit-container>
    <div class="reveal" data-reveal style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%">
      <div class="date-eyebrow" id="dateEyebrow" data-edit-id="date-eyebrow" data-kk="Тойдың басталу уақыты" data-ru="Время начала торжества">Тойдың басталу уақыты</div>
      <div class="date-value" id="dateValue" data-bind="date" data-fmt-kk="YYYY ж. D MMMM" data-fmt-ru="D MMMM YYYY">2026 ж. 12 қыркүйек</div>
      <div class="date-time" id="dateTime" data-bind="date" data-fmt="HH:mm">18:00</div>
      <img class="divider-sm" src="/template-assets/uzatu-template23/divider-rose.webp" alt="" aria-hidden="true" loading="lazy">
      <p class="address" id="locationLines" data-edit-id="location-lines" data-kk="Алматы қ., Әуезов көшесі 25,&#10;«Triumph Hall» мейрамханасы" data-ru="г. Алматы, ул. Ауэзова 25,&#10;ресторан «Triumph Hall»">Алматы қ., Әуезов көшесі 25,
«Triumph Hall» мейрамханасы</p>
      <a class="map-btn" id="mapBtn" href="#" target="_blank" rel="noreferrer" aria-label="Картадан көру" data-bind="map" data-edit-id="map-label" data-kk="Картаға өту" data-ru="Открыть карту">Картаға өту</a>
    </div>
  </section>

  <!-- DRESS CODE -->
  <section class="card" data-block="dress-code" data-edit-id="sec-5" data-edit-container>
    <div class="reveal" data-reveal style="display:flex;flex-direction:column;align-items:center;gap:14px">
      <h2 class="dress-title" id="dressTitle" data-edit-id="dress-title" data-kk="Dress code" data-ru="Dress code">Dress code</h2>
      <p class="dress-note" id="dressNote" data-edit-id="dress-note" data-kk="Құрметті қонақтар, тойға әдемі әрі салтанатты киіммен келулеріңізді сұраймыз." data-ru="Дорогие гости, просим вас прийти в нарядной и торжественной одежде.">Құрметті қонақтар, тойға әдемі әрі салтанатты киіммен келулеріңізді сұраймыз.</p>
      <img class="dress-art" src="/template-assets/uzatu-template23/dress.webp" alt="" aria-hidden="true" loading="lazy">
    </div>
  </section>

  <!-- GALLERY -->
  <section class="card" data-block="gallery" data-edit-id="sec-6" data-edit-container>
    <div class="gallery" id="galleryGrid" data-bind="gallery">
      <img src="/template-assets/uzatu-template23/gallery1.webp" alt="" loading="lazy" decoding="async">
      <img src="/template-assets/uzatu-template23/gallery2.webp" alt="" loading="lazy" decoding="async">
      <img src="/template-assets/uzatu-template23/gallery3.webp" alt="" loading="lazy" decoding="async">
      <img src="/template-assets/uzatu-template23/gallery4.webp" alt="" loading="lazy" decoding="async">
    </div>
  </section>

  <!-- RSVP -->
  <section class="card" data-block="rsvp" data-edit-id="sec-7" data-edit-container>
    <div class="reveal" data-reveal style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px">
      <h2 class="rsvp-title" id="rsvpTitle" data-edit-id="rsvp-title" data-kk="Құрметті қонақ, тойға келетініңізді растаңыз" data-ru="Дорогой гость, подтвердите ваше присутствие">Құрметті қонақ, тойға келетініңізді растаңыз</h2>
      <p class="rsvp-hint" id="rsvpHint" data-edit-id="rsvp-hint" data-kk="Ыңғайлы жауап нұсқасын таңдап, отбасына алдын ала хабарлаңыз." data-ru="Выберите удобный вариант ответа и заранее сообщите семье.">Ыңғайлы жауап нұсқасын таңдап, отбасына алдын ала хабарлаңыз.</p>
      <div id="rsvpForm" class="rsvp-form">
        <div class="field">
          <label class="field-label" id="rNameLabel" data-edit-id="r-name-label" for="rName" data-kk="Есіміңіз" data-ru="Ваше имя">Есіміңіз</label>
          <input class="name-input" id="rName" name="name" autocomplete="name" placeholder="Есіміңіз">
        </div>
        <input type="hidden" id="rPhone" name="phone" value="">
        <input type="hidden" id="rAttending" name="attending" value="true">
        <input type="hidden" id="rNote" name="note" value="">
        <div class="field">
          <div class="radio-list">
            <label class="radio-item">
              <input type="radio" name="attendance" value="yes" checked>
              <span id="attendYesLabel" data-edit-id="attend-yes-label" data-kk="Келемін" data-ru="Приду">Келемін</span>
            </label>
            <label class="radio-item">
              <input type="radio" name="attendance" value="no">
              <span id="attendNoLabel" data-edit-id="attend-no-label" data-kk="Өкінішке орай, келе алмаймын" data-ru="К сожалению, не смогу">Өкінішке орай, келе алмаймын</span>
            </label>
          </div>
        </div>
        <div class="field guests-field" id="rGuestsField">
          <label class="field-label" id="rGuestsLabel" data-edit-id="rsvp-guests-label" for="rGuests" data-kk="Қонақ саны" data-ru="Количество гостей">Қонақ саны</label>
          <input class="guest-count-input" id="rGuests" name="guests" type="number" min="1" value="1" inputmode="numeric">
        </div>
        <button class="submit-btn" id="rsvpSubmit" type="button" data-edit-id="rsvp-submit" data-kk="Жауап беру" data-ru="Ответить">Жауап беру</button>
      </div>
      <div class="success-msg" id="successMsg" data-edit-id="success-msg" data-kk="Рақмет! Жауабыңыз қабылданды." data-ru="Спасибо! Ваш ответ принят.">Рақмет! Жауабыңыз қабылданды.</div>
    </div>
  </section>

  <!-- FINAL -->
  <section class="final" data-block="footer" data-edit-id="sec-8" data-edit-container>
    <img class="final-bg" src="/template-assets/uzatu-template23/hero-poster.webp" alt="" aria-hidden="true" loading="lazy" decoding="async">
    <div class="final-text reveal" data-reveal id="finalText" data-edit-id="final-text" data-kk="Тойымыздың қадірлі қонағы болыңыздар!" data-ru="Будьте дорогими гостями нашего торжества!">Тойымыздың қадірлі қонағы болыңыздар!</div>
  </section>

</main>

</body>
</html>
`;export{a as default};
