'use client';

import { useI18n } from '@/i18n';
import { getCountdownUnits } from '@/lib/shared/countdown-labels';
import { resolveEventDateTime } from '@/lib/shared/event-datetime';
import { useCountdownDiff } from '@/hooks/use-countdown-diff';
import { boundField, type SectionProps } from './types';
import { parseEventDate } from '../types';

export function CountdownSection({ ctx, bindings }: SectionProps) {
  const { t } = useI18n();
  const dateStr = boundField(bindings, 'eventDate', ctx.fields);
  const timeStr = boundField(bindings, 'eventTime', ctx.fields);
  const isKz = ctx.invitation.language === 'kz';
  const title = isKz ? 'ТОЙҒА ДЕЙІН ҚАЛҒАН УАҚЫТ:' : 'ДО ТОРЖЕСТВА ОСТАЛОСЬ:';
  const bg = ctx.assetUrl('countdownBg');
  const confettiL = ctx.assetUrl('confettiL');
  const confettiR = ctx.assetUrl('confettiR');

  const target = resolveEventDateTime(
    parseEventDate(dateStr),
    timeStr,
    ctx.invitation.eventTimezone,
  );
  const diffMs = useCountdownDiff(target);
  const units = diffMs !== null ? getCountdownUnits(diffMs, t) : [];

  return (
    <section
      className="inv-section inv-manifest-countdown"
      data-section="countdown"
      style={
        bg
          ? {
              backgroundImage: `url(${bg})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {confettiL ? (
        <div className="inv-manifest-countdown__confetti inv-manifest-countdown__confetti--l">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={confettiL} alt="" />
        </div>
      ) : null}
      {confettiR ? (
        <div className="inv-manifest-countdown__confetti inv-manifest-countdown__confetti--r">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={confettiR} alt="" />
        </div>
      ) : null}
      <div className="inv-section__inner">
        <p className="inv-label inv-manifest-countdown__title">{title}</p>
        {ctx.fields.eventTime ? (
          <p className="inv-manifest-countdown__time-label">
            {isKz ? 'той уақыты:' : 'время:'}{' '}
            <strong>{ctx.fields.eventTime}</strong>
          </p>
        ) : null}
        {units.length > 0 ? (
          <div className="inv-countdown inv-manifest-countdown__units">
            {units.map(({ value, label }) => (
              <div key={label} className="inv-countdown__unit">
                <span className="inv-countdown__value">{String(value).padStart(2, '0')}</span>
                <span className="inv-countdown__label">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="inv-manifest-countdown__loading">…</p>
        )}
      </div>
    </section>
  );
}
