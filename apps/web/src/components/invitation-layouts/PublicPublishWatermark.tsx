'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';

const LABELS = {
  ru: { label: 'Сделано в QazShaqyru', remove: 'Убрать знак' },
  kz: { label: 'QazShaqyru арқылы жасалған', remove: 'Белгіні алып тастау' },
} as const;

interface Props {
  show: boolean;
  removeHref?: string;
  /**
   * The invitation's language, not the viewer's UI language.
   *
   * This badge is printed across the foot of somebody's invitation, so it has
   * to speak the invitation's language. It was reading the UI locale, so a
   * fully Kazakh wedding page carried a Russian line whenever the viewer's
   * interface happened to be Russian — and a guest opening a shared link has
   * no UI preference of their own to speak of. Same defect class as the wishes
   * wall, which wrote every label in Russian regardless of the invitation.
   */
  locale?: 'ru' | 'kz';
}

/** Public freemium watermark — visible until publication fee is paid. */
export function PublicPublishWatermark({ show, removeHref, locale }: Props) {
  const { t } = useI18n();
  if (!show) return null;
  const copy = locale ? LABELS[locale] : null;

  /*
   * Symmetric padding, so `justify-center` actually centres.
   *
   * It used to be `pl-3 pr-16` — 12px against 64px — which pushed the badge
   * 26px left of centre and read as a misalignment on every published page.
   * The 64px was clearance for the floating share controls that once sat in
   * the bottom-right corner; those were removed (the guest reminder replaced
   * them and sits at the top), so the reserved gap was protecting nothing.
   */
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-4"
      data-testid="publish-watermark"
    >
      {/*
        A solid brand-green plate in the app's own sans, parked in the middle of
        somebody's wedding invitation, was the loudest thing on the page and the
        one element guaranteed to clash with every template. It still says what
        it has to say — it just no longer competes with the design it is sitting
        on.
      */}
      <div className="pointer-events-auto flex max-w-md items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-white/70 shadow-sm backdrop-blur-md">
        <span className="font-body text-[11px] tracking-wide">{copy ? copy.label : t('public.watermark.label')}</span>
        {removeHref ? (
          <Link
            href={removeHref}
            className="rounded-full bg-white/15 px-2.5 py-0.5 font-body text-[11px] font-medium text-white/90 hover:bg-white/25"
          >
            {copy ? copy.remove : t('public.watermark.remove')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
