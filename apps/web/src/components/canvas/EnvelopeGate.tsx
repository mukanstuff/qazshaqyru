'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CanvasElement,
  CoupleNamesElement,
  InvitationCanvasDocument,
} from '@/lib/canvas/types';
import { fontStack } from '@/components/canvas/elements/fontStack';

interface Props {
  document: InvitationCanvasDocument;
  onOpen: () => void;
}

const LABELS = {
  ru: { open: 'Открыть приглашение' },
  kz: { open: 'Шақыруды ашу' },
} as const;

/**
 * The first thing a guest ever sees.
 *
 * This screen used to be a 56px ✉️ emoji centred on a flat colour with the
 * line "Нажмите, чтобы открыть" — hardcoded Russian, in a product whose whole
 * selling point is that the design is beautiful and half of whose invitations
 * are written in Kazakh. It is the highest-leverage frame there is: it is what
 * gets screenshotted into a WhatsApp group, and it is the moment a guest
 * decides whether this looks like a real invitation or like a form.
 *
 * So it now draws an actual envelope, in the invitation's own palette and its
 * own display font, carrying the names and the date, and opens with the flap
 * lifting and the card sliding out. Everything it shows is read from the
 * document; anything the document does not supply is omitted rather than
 * filled with a placeholder.
 */
function textOf(el: CanvasElement | undefined): string | undefined {
  if (!el) return undefined;
  if (el.type === 'text' || el.type === 'heading') return el.text?.trim() || undefined;
  return undefined;
}

function placeholder(doc: InvitationCanvasDocument, key: string): string | undefined {
  return textOf(doc.elements.find((el) => el.placeholderKey === key));
}

/**
 * The couple, as the design actually stores them.
 *
 * `couple-names` is its own element type, with `first`/`second`/`connector`
 * fields and no `text` at all — so reading it the way a text element is read
 * returns nothing, which is how the wax seal on a wedding invitation ended up
 * showing "ҮТ": the initials of the words "Үйлену тойына".
 */
function findCouple(doc: InvitationCanvasDocument): CoupleNamesElement | undefined {
  return doc.elements.find(
    (el): el is CoupleNamesElement => el.type === 'couple-names',
  );
}

const CONNECTOR_GLYPH: Record<CoupleNamesElement['connector'], string> = {
  '&': '&',
  heart: '♥',
  ornament: '·',
  'және': 'және',
  'и': 'и',
};

/**
 * The filmed envelope.
 *
 * A real clip of a real envelope opening, played once, full bleed. Both
 * reference services draw this screen in CSS and so did we — a gradient flap
 * and a gradient disc for the seal — which is exactly the "imitation" the
 * drawn version below can never stop being.
 *
 * Every failure path ends in the invitation opening anyway: the guest has
 * already tapped, so a clip that will not load or will not play must not be
 * allowed to trap them on a poster frame. `ended` normally hands over; the
 * timeout covers a stalled clip, and `onError`/a rejected `play()` hand back
 * to the drawn gate before the tap ever happens.
 */
function FilmedGate({
  src,
  poster,
  focus,
  names,
  date,
  label,
  accent,
  font,
  onOpen,
  onUnavailable,
}: {
  src: string;
  poster?: string;
  focus?: string;
  names?: string;
  date?: string;
  label: string;
  accent: string;
  font: string;
  onOpen: () => void;
  onUnavailable: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const handedOver = useRef(false);

  const handOver = () => {
    if (handedOver.current) return;
    handedOver.current = true;
    setDone(true);
    // Let the clip's last frame sit for a beat and cross-fade into the page.
    window.setTimeout(onOpen, 420);
  };

  const start = () => {
    const el = videoRef.current;
    if (!el) return onUnavailable();
    setPlaying(true);
    const played = el.play();
    if (played && typeof played.catch === 'function') {
      played.catch(() => {
        // Autoplay policy or a codec the browser will not take. Fall back to
        // the drawn envelope rather than leaving a dead poster on screen.
        setPlaying(false);
        onUnavailable();
      });
    }
    // A clip that stalls must not strand the guest. Its own duration is not
    // known reliably before metadata arrives, so this is a flat ceiling.
    window.setTimeout(handOver, 9000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: '#000',
        opacity: done ? 0 : 1,
        transition: 'opacity 400ms ease',
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        onEnded={handOver}
        onError={onUnavailable}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: focus || 'center',
          display: 'block',
        }}
      />
      {/* Scrim under the type only — the clip is the point, so it is not
          dimmed while it plays. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 26%, transparent 52%, rgba(0,0,0,0.58) 100%)',
          opacity: playing ? 0 : 1,
          transition: 'opacity 500ms ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          padding: '0 24px 54px',
          textAlign: 'center',
          color: '#fff',
          opacity: playing ? 0 : 1,
          transition: 'opacity 380ms ease',
          pointerEvents: playing ? 'none' : 'auto',
        }}
      >
        {names ? (
          <p
            style={{
              margin: 0,
              fontFamily: font,
              // A script needs more size than a sans to read at the same
              // weight, and this line is the whole point of the screen.
              fontSize: 38,
              lineHeight: 1.15,
              textShadow: '0 2px 18px rgba(0,0,0,0.5)',
            }}
          >
            {names}
          </p>
        ) : null}
        {date ? (
          <p style={{ margin: 0, fontSize: 15, opacity: 0.85, letterSpacing: '0.08em' }}>{date}</p>
        ) : null}
        <button
          type="button"
          onClick={start}
          data-testid="envelope-open"
          style={{
            appearance: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 999,
            padding: '14px 32px',
            background: accent,
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          {label}
        </button>
      </div>
    </div>
  );
}

export function EnvelopeGate({ document: doc, onOpen }: Props) {
  const locale = doc.locale ?? 'ru';
  const t = LABELS[locale];
  const [opening, setOpening] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [filmUnavailable, setFilmUnavailable] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const design = useMemo(() => {
    const bg = doc.background;
    // The backdrop is the invitation's own background, so the gate and the
    // page behind it read as one object rather than as two screens.
    const backdrop =
      bg.type === 'gradient' && bg.gradient
        ? `linear-gradient(${bg.gradient.angle ?? 160}deg, ${bg.gradient.from}, ${bg.gradient.to})`
        : bg.type === 'image' && bg.imageSrc
          ? // Just enough of a scrim to hold white text. A heavier one turned
            // the pale backgrounds these templates actually ship with into
            // flat grey, which is worse than no artwork at all.
            `linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.30)), url(${JSON.stringify(bg.imageSrc)}) center/cover`
          : bg.color || '#f5f0e8';
    const onImage = bg.type === 'image' && Boolean(bg.imageSrc);

    // Accent and display font are borrowed from the design's own headings, so
    // the envelope belongs to the template rather than to the app's brand.
    // The couple's own line first, then any heading. Picking "the first
    // heading" meant the gate borrowed its face and colour from whatever
    // happened to be marked up as one — on this template the date, set in the
    // figure face — so the envelope screen and the invitation behind it were
    // in different typography.
    const heading =
      doc.elements.find((el) => el.type === 'couple-names') ??
      doc.elements.find((el) => el.placeholderKey === 'groomName') ??
      doc.elements.find((el) => el.type === 'heading');
    const accent =
      doc.envelope?.accent ||
      (heading && 'color' in heading ? (heading.color as string | undefined) : undefined) ||
      '#8a6a3b';
    // `couple-names` calls the field `font`; text and headings call it
    // `fontFamily`. Both hold a family key that means nothing to CSS until it
    // has been through fontStack() — the envelope was silently rendering
    // Georgia for every template.
    const fontKey =
      heading && 'font' in heading
        ? heading.font
        : heading && 'fontFamily' in heading
          ? heading.fontFamily
          : undefined;
    const font = fontKey ? fontStack(fontKey) : 'Georgia, serif';

    return { backdrop, onImage, accent, font };
  }, [doc]);

  const couple = findCouple(doc);
  const first = couple?.first?.trim();
  const second = couple?.second?.trim();
  // `couple-names` is its own element type and no template in the catalogue
  // uses it, so the pair normally has to be read off the two tagged text
  // elements instead. Without this the gate printed a button and nothing else.
  const taggedGroom = placeholder(doc, 'groomName');
  const taggedBride = placeholder(doc, 'brideName');
  const names =
    first && second
      ? `${first} ${CONNECTOR_GLYPH[couple!.connector] ?? '&'} ${second}`
      : taggedGroom && taggedBride
        ? `${taggedGroom} & ${taggedBride}`
        : (first ??
          taggedGroom ??
          placeholder(doc, 'coupleNames') ??
          placeholder(doc, 'heroTitle'));
  const date = placeholder(doc, 'eventDate');
  // Initials come only from a real pair of names, never from a title.
  const initials =
    first && second
      ? `${first.charAt(0)}${second.charAt(0)}`.toLocaleUpperCase()
      : '';

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(onOpen, reduceMotion ? 200 : 820);
  };

  // A filmed opening wins whenever the template supplies one and the browser
  // is willing. Everything below this line is the drawn fallback.
  const film = doc.envelope?.videoSrc;
  if (film && !reduceMotion && !filmUnavailable) {
    return (
      <FilmedGate
        src={film}
        poster={doc.envelope?.posterSrc}
        focus={doc.envelope?.focus}
        names={names}
        date={date}
        label={t.open}
        accent={design.accent}
        font={design.font}
        onOpen={onOpen}
        onUnavailable={() => setFilmUnavailable(true)}
      />
    );
  }

  const paper = '#fffdf7';
  const animate = opening && !reduceMotion;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: 24,
        background: design.backdrop,
        opacity: opening && reduceMotion ? 0 : 1,
        transition: 'opacity 260ms ease',
      }}
    >
      {/* Perspective on the wrapper so the flap opens in 3D instead of
          squashing flat. */}
      <div style={{ perspective: 900 }}>
        <div
          style={{
            position: 'relative',
            width: 'min(78vw, 300px)',
            aspectRatio: '3 / 2',
            transform: animate ? 'translateY(-14px) scale(1.04)' : 'none',
            opacity: animate ? 0 : 1,
            transition:
              'transform 620ms cubic-bezier(.22,1,.36,1) 200ms, opacity 380ms ease 440ms',
          }}
        >
          {/* Body */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 10,
              background: paper,
              boxShadow: '0 22px 48px rgba(0,0,0,0.22)',
            }}
          />
          {/* The two lower folds, so the paper reads as folded rather than as
              a plain rectangle. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 10,
              overflow: 'hidden',
              background: [
                `linear-gradient(135deg, transparent 49.4%, ${design.accent}1f 49.6%)`,
                `linear-gradient(225deg, transparent 49.4%, ${design.accent}14 49.6%)`,
              ].join(', '),
            }}
          />
          {/* Seal. Always drawn — it is the envelope's focal point — but it
              only carries letters when the design actually names a couple. */}
          <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 58,
                height: 58,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: design.accent,
                color: paper,
                fontFamily: design.font,
                fontSize: 19,
                letterSpacing: '0.04em',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25), inset 0 -2px 6px rgba(0,0,0,0.18)',
                zIndex: 3,
              }}
            >
              {initials || (
                <span
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border: `1px solid ${paper}`,
                    opacity: 0.75,
                  }}
                />
              )}
            </div>
          {/* Flap — hinged at the top, lifts away on open. */}
          <div
            style={{
              position: 'absolute',
              insetInline: 0,
              top: 0,
              height: '58%',
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d',
              transform: animate ? 'rotateX(-172deg)' : 'rotateX(0deg)',
              transition: 'transform 560ms cubic-bezier(.65,0,.35,1)',
              zIndex: 4,
              backfaceVisibility: 'hidden',
              background: `linear-gradient(180deg, ${paper}, ${design.accent}22)`,
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              borderRadius: '10px 10px 0 0',
            }}
          />
        </div>
      </div>

      {/* Whose invitation this is. Omitted entirely when the design names
          nobody — an empty line is worse than no line. */}
      {names || date ? (
        <div
          style={{
            textAlign: 'center',
            color: design.onImage ? '#fff' : 'rgba(0,0,0,0.78)',
            textShadow: design.onImage ? '0 1px 12px rgba(0,0,0,0.45)' : undefined,
            opacity: opening ? 0 : 1,
            transition: 'opacity 300ms ease',
          }}
        >
          {/* No "ПРИГЛАШЕНИЕ" eyebrow: on a wedding template the line under
              it already reads "Үйлену тойына шақыру", so the screen said the
              word twice, and an envelope needs no caption explaining that it
              is an invitation. */}
          {names ? (
            <p
              style={{
                margin: '10px 0 0',
                fontFamily: design.font,
                fontSize: 26,
                lineHeight: 1.25,
              }}
            >
              {names}
            </p>
          ) : null}
          {date ? (
            <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.72 }}>{date}</p>
          ) : null}
        </div>
      ) : null}

      {/* A real button. The old screen made the entire viewport one giant
          unlabelled click target, which reads as a broken page on desktop
          where nothing invites a tap. */}
      <button
        type="button"
        onClick={handleOpen}
        data-testid="envelope-open"
        style={{
          appearance: 'none',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 999,
          padding: '13px 30px',
          background: design.accent,
          color: paper,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.01em',
          boxShadow: '0 10px 26px rgba(0,0,0,0.22)',
          opacity: opening ? 0 : 1,
          transition: 'opacity 240ms ease',
        }}
      >
        {t.open}
      </button>
    </div>
  );
}
