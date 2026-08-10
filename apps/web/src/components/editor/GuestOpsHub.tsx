'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  MessageCircle,
  QrCode,
  PencilLine,
  Building2,
  Download,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n';
import { QrCodePanel } from '@/components/shared/QrCodePanel';
import { PaymentStatusBanner } from '@/components/orders/PaymentStatusBanner';
import { PaymentPendingBanner } from '@/components/dashboard/PaymentPendingBanner';
import {
  buildInviteShareMessage,
  buildPublicInviteUrl,
  buildWhatsAppShareUrl,
} from '@/lib/invitations/share-url';
import { checkoutInvitationClient } from '@/lib/payments/checkout-client';
import type { GuestFunnelStats } from '@/lib/guests/guest-funnel';
import { PLAN_CATALOG } from '@/lib/entitlements/plan-catalog';
import { PostPublishShareScreen } from '@/components/editor/PostPublishShareScreen';
import { cn } from '@/lib/shared/utils';
import { resolveHostApiError } from '@/lib/guests/host-api-error';

export interface GuestOpsHubProps {
  invitationId: string;
  invitationSlug: string;
  invitationTitle: string;
  templateKey: string;
  status: 'draft' | 'published' | 'archived';
  isPublished: boolean;
  priceKzt: number;
  editHref: string;
  planSku: string;
  watermark: boolean;
  guestOpsUnlocked: boolean;
  customSlugAllowed: boolean;
  restaurantLinkAllowed: boolean;
  funnel: GuestFunnelStats;
  confirmedSeats: number;
  expectedSeats: number;
  showPublishedBanner?: boolean;
  showPostPublishShare?: boolean;
  guestCount?: number;
  openRsvp?: boolean;
  showPaymentFailed?: boolean;
  showPaymentInvalid?: boolean;
  showPaymentPending?: boolean;

  /** 
   * 2026-07-30 product model: true when user paid the template price.
   * When true → full access (no upsells, all features unlocked).
   */
  fullAccess?: boolean;
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

function planDisplayName(
  planSku: string,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  const key = `dashboard.plans.${planSku}`;
  const label = t(key);
  return label === key ? planSku : label;
}

export function GuestOpsHub(props: GuestOpsHubProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [restaurantUrl, setRestaurantUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slugDraft, setSlugDraft] = useState(props.invitationSlug);
  const [slugSaved, setSlugSaved] = useState(props.invitationSlug);
  const [showPostPublish, setShowPostPublish] = useState(Boolean(props.showPostPublishShare));
  const [funnelFilter, setFunnelFilter] = useState<
    'all' | 'attending' | 'not_attending' | 'pending' | 'opened'
  >('all');

  const filteredFunnel = useMemo(() => {
    switch (funnelFilter) {
      case 'attending':
        return { ...props.funnel, sent: props.funnel.attending, total: props.funnel.attending };
      case 'not_attending':
        return {
          ...props.funnel,
          sent: props.funnel.notAttending,
          total: props.funnel.notAttending,
        };
      case 'pending':
        return { ...props.funnel, sent: props.funnel.pending, total: props.funnel.pending };
      case 'opened':
        return { ...props.funnel, sent: props.funnel.opened, total: props.funnel.opened };
      case 'all':
      default:
        return props.funnel;
    }
  }, [funnelFilter, props.funnel]);

  const publicUrl = useMemo(
    () =>
      typeof window === 'undefined'
        ? `/i/${slugSaved}`
        : buildPublicInviteUrl(window.location.origin, slugSaved),
    [slugSaved]
  );
  const shareText = useMemo(
    () => buildInviteShareMessage(publicUrl, props.invitationTitle),
    [publicUrl, props.invitationTitle]
  );
  const whatsappUrl = useMemo(() => buildWhatsAppShareUrl(shareText), [shareText]);

  const unlock = useCallback(
    async () => {
      setBusy('pay-template');
      setError(null);
      try {
        const checkout = await checkoutInvitationClient(props.invitationId, {
          intent: 'pay',
        });
        if (checkout.paymentUrl) {
          window.location.href = checkout.paymentUrl;
          return;
        }
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : t('dashboard.guestOps.payError'));
      } finally {
        setBusy(null);
      }
    },
    [props.invitationId, t]
  );

  const createRestaurantLink = useCallback(async () => {
    setBusy('restaurant');
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${props.invitationId}/restaurant-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          resolveHostApiError(data, t, 'dashboard.guestOps.linkError')
        );
      }
      setRestaurantUrl(data.url as string);
      await copyText(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('dashboard.guestOps.genericError'));
    } finally {
      setBusy(null);
    }
  }, [props.invitationId, t]);

  const exportCsv = useCallback(async () => {
    setBusy('csv');
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${props.invitationId}/guests/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          resolveHostApiError(data, t, 'dashboard.guestOps.exportError')
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guests-${slugSaved}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('dashboard.guestOps.exportError'));
    } finally {
      setBusy(null);
    }
  }, [props.invitationId, slugSaved, t]);

  const saveSlug = useCallback(async () => {
    if (!props.customSlugAllowed) return;
    setBusy('slug');
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${props.invitationId}/slug`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugDraft.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          resolveHostApiError(data, t, 'dashboard.guestOps.slugError')
        );
      }
      setSlugSaved(data.slug as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('dashboard.guestOps.genericError'));
    } finally {
      setBusy(null);
    }
  }, [props.customSlugAllowed, props.invitationId, slugDraft, t]);

  const statusLabel =
    props.status === 'published' ? t('dashboard.status.published') : t('dashboard.status.draft');
  const planLabel = props.fullAccess 
    ? 'Полный доступ (оплачен шаблон)' 
    : t('dashboard.guestOps.planLabel', { plan: planDisplayName(props.planSku, t) });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(180deg,var(--us-ivory),color-mix(in_srgb,var(--us-cream)_96%,white_4%))]">
      {showPostPublish ? (
        <PostPublishShareScreen
          invitationId={props.invitationId}
          invitationSlug={slugSaved}
          invitationTitle={props.invitationTitle}
          guestCount={props.guestCount ?? props.funnel.sent}
          openRsvp={props.openRsvp ?? true}
          guestOpsUnlocked={props.guestOpsUnlocked}
          restaurantUrl={restaurantUrl}
          busy={busy}
          onDismiss={() => setShowPostPublish(false)}
          onExportCsv={() => void exportCsv()}
          onRestaurantLink={() => void createRestaurantLink()}
        />
      ) : null}
      {showPostPublish ? null : (
        <>
          {props.showPublishedBanner ? <PaymentStatusBanner variant="published" /> : null}
          {!props.showPublishedBanner && props.showPaymentFailed ? (
            <PaymentStatusBanner variant="failed" />
          ) : null}
          {!props.showPublishedBanner && props.showPaymentInvalid ? (
            <PaymentStatusBanner variant="invalid" />
          ) : null}
          {props.showPaymentPending ? <PaymentPendingBanner initialPending alwaysPoll /> : null}

          <div className="mx-auto w-full max-w-6xl p-4 pb-10 lg:p-8">
            <section className="us-glass overflow-hidden rounded-[2rem] border shadow-us-sm">
              <div className="border-b border-us-border/60 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--us-ivory)_94%,white_6%),var(--us-cream))] p-5 sm:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-us-border/70 bg-us-cream px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-us-accent">
                      <span className="h-2 w-2 rounded-full bg-us-accent" />
                      {t('dashboard.guestOps.badge')}
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="font-display text-3xl leading-tight sm:text-4xl">
                        {props.invitationTitle}
                      </CardTitle>
                      <p className="max-w-2xl font-body text-sm text-us-ink-muted sm:text-base">
                        {props.isPublished
                          ? t('dashboard.guestOps.publishedDesc')
                          : t('dashboard.guestOps.draftDesc')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-us-border bg-us-cream px-3 py-1">
                        {statusLabel}
                      </span>
                      <span className="rounded-full border border-us-border bg-us-cream px-3 py-1">
                        {planLabel}
                      </span>
                      {props.watermark ? (
                        <span className="rounded-full border border-us-accent/30 bg-us-accent/10 px-3 py-1 text-us-accent">
                          {t('dashboard.guestOps.withWatermark')}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[30rem] lg:grid-cols-2">
                    <HeroSeatStat
                      label={t('dashboard.guestOps.seatsConfirmed')}
                      value={props.confirmedSeats}
                      accent
                    />
                    <HeroSeatStat
                      label={t('dashboard.guestOps.seatsExpected')}
                      value={props.expectedSeats}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.12fr_0.88fr]">
                <section className="space-y-5">
                  <div className="us-glass rounded-[1.75rem] border p-5 shadow-us-sm">
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { value: 'all', label: t('dashboard.guestOps.chipAll') },
                          {
                            value: 'attending',
                            label: t('dashboard.guestOps.attending', {
                              count: props.funnel.attending,
                            }),
                          },
                          {
                            value: 'not_attending',
                            label: t('dashboard.guestOps.notAttending', {
                              count: props.funnel.notAttending,
                            }),
                          },
                          {
                            value: 'pending',
                            label: t('dashboard.guestOps.pending', {
                              count: props.funnel.pending,
                            }),
                          },
                          {
                            value: 'opened',
                            label: t('dashboard.guestOps.opened', {
                              count: props.funnel.opened,
                            }),
                          },
                        ] as const
                      ).map((chip) => {
                        const active = funnelFilter === chip.value;
                        return (
                          <button
                            key={chip.value}
                            type="button"
                            onClick={() => setFunnelFilter(chip.value)}
                            className={cn(
                              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                              active
                                ? 'border-us-accent bg-us-accent text-white shadow-us-sm'
                                : 'border-us-border bg-us-cream text-us-ink hover:border-us-accent/40',
                            )}
                            aria-pressed={active}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <MiniFunnelChip
                        label={t('dashboard.guestOps.sent')}
                        value={filteredFunnel.sent}
                        hint={`${filteredFunnel.total}`}
                      />
                      <MiniFunnelChip
                        label={t('dashboard.guestOps.opened')}
                        value={filteredFunnel.opened}
                        hint={`${filteredFunnel.openedPercent}%`}
                      />
                      <MiniFunnelChip
                        label={t('dashboard.guestOps.responded')}
                        value={filteredFunnel.responded}
                        hint={`${filteredFunnel.respondedPercent}%`}
                      />
                    </div>
                    <div className="mt-5 flex items-center gap-3 text-sm text-us-ink-muted">
                      <span>
                        {t('dashboard.guestOps.attending', { count: props.funnel.attending })}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-us-border" />
                      <span>
                        {t('dashboard.guestOps.notAttending', {
                          count: props.funnel.notAttending,
                        })}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-us-border" />
                      <span>
                        {t('dashboard.guestOps.pending', { count: props.funnel.pending })}
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-us-border/35">
                      <div
                        className="h-full rounded-full bg-us-accent"
                        style={{
                          width: `${Math.min(100, Math.max(0, props.funnel.respondedPercent))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="us-glass rounded-[1.75rem] border p-5 shadow-us-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <h2 className="font-display text-2xl">{t('dashboard.guestOps.shareTitle')}</h2>
                        <p className="max-w-2xl text-sm text-us-ink-muted">
                          {t('dashboard.guestOps.shareDesc')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button asChild className="bg-us-accent px-5 text-white hover:bg-us-accent-strong">
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle size={18} />
                          {t('dashboard.guestOps.sendWhatsApp')}
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          void copyText(publicUrl);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 1200);
                        }}
                      >
                        <Copy size={18} />
                        {copied ? t('dashboard.guestOps.copied') : t('dashboard.guestOps.copyLink')}
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="#qr">
                          <QrCode size={18} />
                          {t('dashboard.guestOps.qr')}
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={props.editHref}>
                          <PencilLine size={18} />
                          {t('dashboard.guestOps.edit')}
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* 
                    2026-07-30 OWNER MODEL (PRODUCT_DECISIONS_2026-07-30.md):
                    Pay template price ONCE → fullAccess = true for this invitation.
                    NO Standard / Premium upsells in the regular single-invite journey.
                    Everything (no watermark, guests, export, restaurant, custom slug, full editor) is available.
                  */}
                  {!props.fullAccess ? (
                    <div className="us-glass rounded-[1.75rem] border p-5 shadow-us-sm">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-us-accent/10 p-2 text-us-accent">
                          <Lock size={18} />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h2 className="font-display text-2xl">
                              {t('dashboard.guestOps.unlockFullAccess')}
                            </h2>
                            <p className="mt-1 text-sm text-us-ink-muted">
                              После оплаты цены шаблона ({(props.priceKzt || 3990 /* admin fallback only; real price from getInvitationPricing */).toLocaleString('ru-RU')} ₸) у вас сразу полный доступ: без водяного знака, все функции гостей, своя ссылка, рассадка и экспорт.
                            </p>
                          </div>
                          <Button
                            disabled={busy === 'pay-template'}
                            onClick={() => void unlock()}
                            className="w-full"
                          >
                            Оплатить цену шаблона — получить полный доступ
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="us-glass rounded-[1.75rem] border p-4 text-sm text-us-accent">
                      ✓ Полный доступ (оплата шаблона). Все функции гостей и редактирование доступны.
                    </div>
                  )}
                </section>

                <aside className="space-y-4">
                  <div className="us-glass rounded-[1.75rem] border p-4 sm:p-5 shadow-us-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-display text-2xl">{t('dashboard.guestOps.qrTitle')}</h2>
                      <span className="text-xs text-us-ink-muted">
                        {t('dashboard.guestOps.qrHint')}
                      </span>
                    </div>
                    <div
                      id="qr"
                      className="mt-4 flex justify-center rounded-2xl border border-us-border bg-us-ivory p-4"
                    >
                      <QrCodePanel url={publicUrl} label={t('invitation.edit.qrLabel')} />
                    </div>
                  </div>

                  {props.customSlugAllowed ? (
                    <div className="us-glass rounded-[1.75rem] border p-4 sm:p-5 shadow-us-sm">
                      <h2 className="font-display text-2xl">
                        {t('dashboard.guestOps.customSlugTitle')}
                      </h2>
                      <div className="mt-3 flex gap-2">
                        <span className="flex items-center text-sm text-us-ink-muted">/i/</span>
                        <input
                          className="flex-1 rounded-lg border border-us-border bg-us-ivory px-3 py-2 font-mono text-sm"
                          value={slugDraft}
                          onChange={(e) => setSlugDraft(e.target.value.toLowerCase())}
                          maxLength={64}
                        />
                      </div>
                      <Button
                        className="mt-3"
                        variant="outline"
                        disabled={busy === 'slug' || slugDraft === slugSaved}
                        onClick={() => void saveSlug()}
                      >
                        {t('dashboard.guestOps.saveSlug')}
                      </Button>
                    </div>
                  ) : props.watermark ? (
                    <div className="us-glass rounded-[1.75rem] border p-4 sm:p-5 shadow-us-sm">
                      <p className="text-sm text-us-ink-muted">
                        {t('dashboard.guestOps.unlockFullAccess')}
                      </p>
                      <Button
                        className="mt-3"
                        disabled={!!busy}
                        onClick={() => void unlock()}
                      >
                        {t('dashboard.guestOps.unlockFullAccess')}
                      </Button>
                    </div>
                  ) : null}

                  {/* Full access mode — show all ops unlocked (owner model) */}
                  <div className="us-glass rounded-[1.75rem] border p-4 sm:p-5 shadow-us-sm">
                    <div className="space-y-3">
                      <div>
                        <h2 className="font-display text-2xl">
                          {t('dashboard.guestOps.moreActions')}
                        </h2>
                        <p className="mt-1 text-sm text-us-ink-muted">
                          Всё доступно после оплаты шаблона.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                          <Link href={`${props.editHref}&panel=guests`}>
                            {t('dashboard.guestOps.guestsFamilies')}
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy === 'csv'}
                          onClick={() => void exportCsv()}
                        >
                          <Download size={16} />
                          {t('dashboard.guestOps.exportList')}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy === 'restaurant'}
                          onClick={() => void createRestaurantLink()}
                        >
                          <Building2 size={16} />
                          {t('dashboard.guestOps.restaurant')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            void fetch(`/api/invitations/${props.invitationId}/remind`, {
                              method: 'POST',
                            })
                              .then(async (r) => {
                                const d = await r.json().catch(() => ({}));
                                if (!r.ok) {
                                  throw new Error(
                                    resolveHostApiError(d, t, 'dashboard.guestOps.genericError')
                                  );
                                }
                                const links = (d.guests as Array<{ whatsappLink: string | null; name: string }>)
                                  .filter((g) => g.whatsappLink)
                                  .map((g) => `${g.name}: ${g.whatsappLink}`)
                                  .join('\n');
                                if (links) await copyText(links);
                                else setError(t('dashboard.guestOps.allConfirmed'));
                              })
                              .catch((err) =>
                                setError(err instanceof Error ? err.message : t('dashboard.guestOps.genericError'))
                              );
                          }}
                        >
                          <MessageCircle size={16} />
                          {t('dashboard.guestOps.remindersWa')}
                        </Button>
                      </div>
                      {restaurantUrl ? (
                        <div className="break-all rounded-xl border border-us-border bg-us-cream px-3 py-2 font-mono text-xs">
                          {restaurantUrl}
                          <span className="mt-1 block text-us-ink-muted">
                            {t('dashboard.guestOps.copiedBuffer')}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {error ? (
                    <p className="rounded-xl border border-us-accent/30 bg-us-accent/5 px-3 py-2 text-sm text-us-accent">
                      {error}
                    </p>
                  ) : null}
                </aside>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function HeroSeatStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4 shadow-us-sm',
        accent ? 'us-glass border-us-accent/20' : 'us-glass-soft'
      )}
    >
      <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-us-ink-muted">
        {label}
      </p>
      <div className="mt-2 font-display text-4xl leading-none text-us-ink sm:text-5xl">{value}</div>
    </div>
  );
}

function MiniFunnelChip({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-us-border/60 bg-us-cream px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-us-ink-muted">{label}</div>
      <div className="mt-1 font-display text-2xl text-us-ink">{value}</div>
      <div className="text-xs text-us-ink-muted">{hint}</div>
    </div>
  );
}
