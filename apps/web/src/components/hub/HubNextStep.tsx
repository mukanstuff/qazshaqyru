'use client';

import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import { isGuestPending, type HubGuest } from '@/components/hub/useHubGuests';

/**
 * The one thing to do next.
 *
 * The hub is eleven rows of identical weight — Оформление, Тексты, Дата и место,
 * Музыка, Шаблон, Гости, Напоминания, Рассадка, Как гости увидят, Тойхана,
 * Архив. It is a complete menu and a useless map: nothing on it says what a
 * first-time customer should do first, or what they have already finished. The
 * real journey has an order (edit → publish → add guests → send personal links
 * → chase the silent ones → seat everybody), and every one of those steps is
 * inferable from data the hub already holds.
 *
 * So one card, above the menu, naming the single next action. The menu stays
 * underneath for anyone who wants to jump around.
 */
type Step = {
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
};

interface Props {
  status: 'draft' | 'published' | 'archived';
  guests: HubGuest[];
  guestCount: number;
  onPublish: () => void;
  onOpenGuests: () => void;
  onOpenReminders: () => void;
  onOpenSeating: () => void;
}

export function HubNextStep({
  status,
  guests,
  guestCount,
  onPublish,
  onOpenGuests,
  onOpenReminders,
  onOpenSeating,
}: Props) {
  const { t } = useI18n();
  const k = (key: string) => t(`invitation.hub.nextStep.${key}`);

  const resolve = (): Step | null => {
    if (status === 'archived') return null;

    if (status !== 'published') {
      return {
        title: k('publishTitle'),
        desc: k('publishDesc'),
        /*
         * The step, without the price.
         *
         * The button read "К публикации · 4 990 ₸" and it was the second of
         * three requests for the same money on one screen: the hero button
         * above and the lock card below both say "Оплатить · 4 990 ₸". This
         * block explains what to do next; it is not the place to negotiate.
         */
        cta: k('publishCta'),
        onClick: onPublish,
      };
    }

    if (guestCount === 0) {
      return {
        title: k('guestsTitle'),
        desc: k('guestsDesc'),
        cta: k('guestsCta'),
        onClick: onOpenGuests,
      };
    }

    // Nobody has been given a personal link yet — that is what `sentAt` records.
    if (guests.length > 0 && guests.every((g) => !g.sentAt)) {
      return {
        title: k('linksTitle'),
        desc: k('linksDesc'),
        cta: k('linksCta'),
        onClick: onOpenGuests,
      };
    }

    const pending = guests.filter(isGuestPending).length;
    if (pending > 0) {
      return {
        title: t('invitation.hub.nextStep.remindTitle', { count: pending }),
        desc: k('remindDesc'),
        cta: k('remindCta'),
        onClick: onOpenReminders,
      };
    }

    return {
      title: k('seatingTitle'),
      desc: k('seatingDesc'),
      cta: k('seatingCta'),
      onClick: onOpenSeating,
    };
  };

  const step = resolve();
  if (!step) return null;

  return (
    <div className="hub-next-step">
      <p className="hub-next-step__label">{k('label')}</p>
      <p className="hub-next-step__title">{step.title}</p>
      <p className="hub-next-step__desc">{step.desc}</p>
      <button type="button" className="hub-next-step__cta" onClick={step.onClick}>
        {step.cta}
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
