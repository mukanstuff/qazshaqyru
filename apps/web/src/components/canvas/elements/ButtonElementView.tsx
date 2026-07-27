import type { CSSProperties } from 'react';
import type { ButtonElement } from '@/lib/canvas/types';
import { fontStack } from './TextElementView';

export function ButtonElementView({
  el,
  locale = 'ru',
}: {
  el: ButtonElement;
  locale?: 'ru' | 'kz';
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
    border: 'none',
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

  const href = computeHref(el, locale);

  if (href) {
    return (
      <a href={href} style={style} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {el.label}
      </a>
    );
  }
  return <button type="button" style={style}>{el.label}</button>;
}

function computeHref(el: ButtonElement, locale: 'ru' | 'kz'): string | null {
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
    case 'calendar': return '#calendar';
    default: return null;
  }
}
