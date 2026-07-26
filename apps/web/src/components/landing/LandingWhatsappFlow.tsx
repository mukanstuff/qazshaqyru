'use client';

import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';

import { useI18n } from '@/i18n';
import { LANDING_HERO_SCREEN } from '@/lib/landing/assets';

export function LandingWhatsappFlow() {
  const { t } = useI18n();

  return (
    <motion.div
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white shadow-[0_22px_50px_-28px_rgba(44,24,16,0.22)]"
    >
      <div className="flex items-center gap-3 bg-us-accent px-4 py-3 text-us-cream">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
          А
        </div>
        <div>
          <div className="text-sm font-semibold">{t('landing.v2.whatsapp.chatTitle')}</div>
          <div className="text-[11px] text-white/75">{t('landing.v2.whatsapp.chatSubtitle')}</div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/40 bg-white/55 px-3 py-2 text-sm text-us-ink shadow-sm backdrop-blur-md">
          {t('landing.v2.whatsapp.messageIntro')}
        </div>

        <div className="ml-auto max-w-[92%] overflow-hidden rounded-2xl rounded-tr-sm bg-us-cream shadow-sm">
          <div className="h-24 bg-cover bg-top" style={{ backgroundImage: `url(${LANDING_HERO_SCREEN})` }} />
          <div className="space-y-1 px-3 py-2.5">
            <div className="text-sm font-semibold text-us-ink">{t('landing.v2.whatsapp.linkTitle')}</div>
            <div className="text-xs text-us-ink-muted">{t('landing.v2.whatsapp.linkDesc')}</div>
            <div className="flex items-center gap-1 pt-1 text-[11px] font-medium text-us-accent">
              qazshaqyru.kz
              <ExternalLink className="h-3 w-3" />
            </div>
          </div>
        </div>

        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/80 px-3 py-2 text-sm text-us-ink shadow-sm">
          {t('landing.v2.whatsapp.reply')}
        </div>
      </div>
    </motion.div>
  );
}
