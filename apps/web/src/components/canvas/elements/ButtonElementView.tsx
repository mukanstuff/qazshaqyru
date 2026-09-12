import type { CSSProperties } from 'react';
import type { ButtonElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

export function ButtonElementView({
  el,
  locale = 'ru',
  shareUrl,
  stopPropagation = false,
}: {
  el: ButtonElement;
  locale?: 'ru' | 'kz';
  shareUrl?: string;
  /** In editor mode the canvas owns the tap → select behaviour.
   *  Stop propagation so button's native action (RSVP / link) doesn't
   *  fire before the element gets selected. */
  stopPropagation?: boolean;
}) {
  const style: CSSProperties = {
    width: '100%',
    minHeight: typeof el.h === 'number' ? el.h : 48,
    padding: `${el.paddingY ?? 12}px ${el.paddingX ?? 24}px`,
    background: el.bgColor,
    color: el.textColor,
    fontFamily: fontStack(el.fontFamily),
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    borderRadius: el.borderRadius,
    // An outline button is the pairing of a transparent fill with this rule.
    // Hardcoding `none` here is what made the map button render as loose text.
    border: el.borderColor ? `${el.borderWidth ?? 1}px solid ${el.borderColor}` : 'none',
    cursor: 'pointer',
    textAlign: 'center',
    boxShadow: el.shadow
      ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}`
      : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  };

  const href = computeHref(el, locale, shareUrl);

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
  };

  if (href) {
    return (
      <a
        href={stopPropagation ? '#' : href}
        style={style}
        onClick={handleClick}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
      >
        {el.label}
      </a>
    );
  }
  return (
    <button type="button" style={style} onClick={handleClick}>
      {el.label}
    </button>
  );
}

function computeHref(el: ButtonElement, locale: 'ru' | 'kz', shareUrl?: string): string | null {
  switch (el.action.kind) {
    case 'rsvp': return '#rsvp';
    case 'link': return el.action.href;
    case 'map': return el.action.href || '#map';
    case 'phone': return el.action.phone ? `tel:${el.action.phone.replace(/\D/g, '')}` : null;
    case 'whatsapp': {
      const phone = (el.action.phone || '').replace(/\D/g, '');
      const text = el.action.text || (locale === 'kz' ? 'Сәлеметсіз бе!' : 'Здравствуйте!');
      return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : null;
    }
    case 'calendar': {
      const slug = shareUrl ? shareUrl.split('/i/')[1]?.split('/')[0] : null;
      return slug ? `/api/invitations/public/${slug}/ics` : '#calendar';
    }
    default: return null;
  }
}
