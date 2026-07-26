'use client';

import { Music } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { SectionProps } from './types';

export function MusicSection({ ctx }: SectionProps) {
  const { t } = useI18n();
  const hasMusic = Boolean(ctx.invitation.musicUrl);
  const isKz = ctx.invitation.language === 'kz';

  if (!hasMusic) return null;

  return (
    <section className="inv-section inv-manifest-music" data-section="music">
      <div className="inv-section__inner" style={{ textAlign: 'center' }}>
        <button
          type="button"
          className="inv-manifest-music__btn"
          onClick={ctx.onToggleMusic}
          aria-pressed={ctx.isPlaying}
        >
          <Music size={18} aria-hidden />
          {ctx.isPlaying
            ? t('public.music.off')
            : isKz
              ? 'Әуен қосу'
              : t('public.music.on')}
        </button>
      </div>
    </section>
  );
}
