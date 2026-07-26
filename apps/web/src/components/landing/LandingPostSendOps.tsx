'use client';

import { Download, Table2, Users } from 'lucide-react';

import { useI18n } from '@/i18n';

const FUNNEL_STEPS = [
  {
    labelKey: 'funnelSent',
    countKey: 'funnelSentCount',
    width: '100%',
  },
  {
    labelKey: 'funnelOpened',
    countKey: 'funnelOpenedCount',
    width: '78%',
  },
  {
    labelKey: 'funnelAnswered',
    countKey: 'funnelAnsweredCount',
    width: '24%',
  },
  {
    labelKey: 'funnelComing',
    countKey: 'funnelComingCount',
    width: '21%',
  },
] as const;

export function LandingPostSendOps() {
  const { t } = useI18n();

  return (
    <section className="bg-white py-20" data-testid="landing-post-send-ops">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center md:text-left">
          <p className="us-overline mb-5">{t('landing.v2.postSend.overline')}</p>
          <h2 className="font-display text-3xl text-us-ink md:text-4xl">
            {t('landing.v2.postSend.title')}{' '}
            <span className="text-us-accent">{t('landing.v2.postSend.titleAccent')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-us-ink-muted md:mx-0 md:text-base">
            {t('landing.v2.postSend.subtitle')}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-us-accent/10 bg-us-cream/70 p-6 shadow-[0_20px_40px_-24px_rgba(44,24,16,0.18)] md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-us-ink-muted">
                  <Users className="h-3.5 w-3.5 text-us-accent" aria-hidden />
                  {t('landing.v2.features.rsvpTitle')}
                </div>
                <p className="font-display text-3xl text-us-ink md:text-4xl">
                  {t('landing.v2.postSend.answeredLabel')}
                </p>
                <p className="mt-1 text-sm text-us-ink-muted">
                  {t('landing.v2.postSend.answeredHint')}
                </p>
              </div>
              <div className="rounded-2xl bg-us-accent px-4 py-3 text-center text-us-cream">
                <div className="font-display text-2xl">47</div>
                <div className="text-[10px] uppercase tracking-wider text-white/70">/ 200</div>
              </div>
            </div>

            <div className="mb-3 text-sm font-semibold text-us-ink">
              {t('landing.v2.postSend.funnelTitle')}
            </div>
            <div className="space-y-3">
              {FUNNEL_STEPS.map((step) => (
                <div key={step.labelKey}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-us-ink-muted">
                      {t(`landing.v2.postSend.${step.labelKey}`)}
                    </span>
                    <span className="font-semibold text-us-ink">
                      {t(`landing.v2.postSend.${step.countKey}`)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-us-accent/10">
                    <div
                      className="h-full rounded-full bg-us-accent"
                      style={{ width: step.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex-1 rounded-[1.75rem] border border-us-accent/10 bg-us-ink p-6 text-white md:p-8">
              <div className="mb-3 flex items-center gap-2 text-us-gold">
                <Download className="h-4 w-4" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  {t('landing.v2.postSend.csvTitle')}
                </span>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-white/80">
                {t('landing.v2.postSend.csvDesc')}
              </p>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-[11px] text-white/70">
                name,party,allergy,table
                <br />
                Аида С.,2,—,3
                <br />
                Болат Н.,1,lactose,5
                <br />
                Гульнара А.,3,—,3
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="mt-5 inline-flex cursor-default items-center gap-2 rounded-full bg-us-cream px-5 py-2.5 text-sm font-semibold text-us-accent"
                aria-hidden
              >
                <Download className="h-4 w-4" />
                {t('landing.v2.postSend.csvButton')}
              </button>
            </div>

            <div className="rounded-[1.75rem] border border-us-accent/10 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-us-accent/8 text-us-accent">
                  <Table2 className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-sm font-medium text-us-ink">
                  {t('landing.v2.postSend.seatingNote')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
